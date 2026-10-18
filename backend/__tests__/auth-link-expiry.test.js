import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";

import { startTestDb, TEST_JWT_SECRET, DUMMY_BCRYPT_HASH } from "./helpers/test-env.js";
import createApp from "../app.js";
import User from "../models/user.js";
import Verification from "../models/verification.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvite from "../models/workspace-invite.js";

// send-email.js calls global fetch; patching it here gives deterministic
// outcomes and keeps tests off the real Brevo API.
const app = createApp();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HOUR_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  "If an account with that email exists, a reset password email has been sent.";

describe("Auth link expiry + anti-enumeration (A8/A9/A13)", () => {
  let stopTestDb;
  let owner;
  let workspace;
  let fetchMock;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await User.create({
      name: "Expiry Owner",
      email: "expiry-owner@test.local",
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: true,
    });
    await User.create({
      name: "Unverified Reset",
      email: "expiry-unverified@test.local",
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: false,
    });

    workspace = await Workspace.create({
      name: "Expiry Workspace",
      owner: owner._id,
      members: [{ user: owner._id, role: "owner" }],
    });

    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterAll(async () => {
    globalThis.fetch = undefined;
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("expired verify-email link returns 401 with its expiry message", async () => {
    const token = jwt.sign(
      { userId: owner._id, purpose: "email-verification" },
      TEST_JWT_SECRET,
      { expiresIn: "1s" },
    );
    await Verification.create({
      token,
      userId: owner._id,
      expiresAt: new Date(Date.now() + HOUR_MS),
    });
    await sleep(1200);

    const res = await request(app)
      .post("/api-v1/auth/verify-email")
      .send({ token });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Verification token expired");
  });

  test("malformed verify-email token returns 401, not 500", async () => {
    const res = await request(app)
      .post("/api-v1/auth/verify-email")
      .send({ token: "malformed-token" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("expired reset link returns 401 'Token expired'", async () => {
    const token = jwt.sign(
      { userId: owner._id, purpose: "reset-password" },
      TEST_JWT_SECRET,
      { expiresIn: "1s" },
    );
    await Verification.create({
      token,
      userId: owner._id,
      expiresAt: new Date(Date.now() + HOUR_MS),
    });
    await sleep(1200);

    const res = await request(app).post("/api-v1/auth/reset-password").send({
      token,
      newPassword: "BrandNewPass123",
      confirmPassword: "BrandNewPass123",
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token expired");
  });

  test("expired email-invite link returns 401 'Invitation has expired'", async () => {
    const token = jwt.sign(
      { user: owner._id, workspaceId: workspace._id, role: "member" },
      TEST_JWT_SECRET,
      { expiresIn: "1s" },
    );
    await WorkspaceInvite.create({
      type: "email",
      user: owner._id,
      workspaceId: workspace._id,
      token,
      role: "member",
      expiresAt: new Date(Date.now() + HOUR_MS),
    });
    await sleep(1200);

    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set(
        "Authorization",
        `Bearer ${jwt.sign({ userId: owner._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`,
      )
      .send({ token });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invitation has expired");
  });

  test("reset request for unknown email returns the generic 200", async () => {
    const res = await request(app)
      .post("/api-v1/auth/reset-password-request")
      .send({ email: "ghost-who-does-not-exist@test.local" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_RESET_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("reset request for unverified email returns the generic 200 too", async () => {
    const res = await request(app)
      .post("/api-v1/auth/reset-password-request")
      .send({ email: "expiry-unverified@test.local" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_RESET_MESSAGE);
    expect(res.body.message).not.toContain("verify");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("failed resends do not consume the resend window", async () => {
    const user = await User.create({
      name: "Failed Resend",
      email: "expiry-resend-fail@test.local",
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: false,
    });
    // an EXPIRED verification doc exists — the resend path deletes it and retries
    await Verification.create({
      user: user._id,
      userId: user._id,
      token: jwt.sign(
        { userId: user._id, purpose: "email-verification" },
        TEST_JWT_SECRET,
        { expiresIn: "1s" },
      ),
      expiresAt: new Date(Date.now() - 1000),
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () => "denied",
    });
    const first = await request(app)
      .post("/api-v1/auth/login")
      .send({ email: user.email, password: "whatever-is-not-checked-here" });
    expect(first.status).toBe(500);

    // no NEW verification doc may exist after the failed send
    expect(await Verification.countDocuments({ userId: user._id })).toBe(0);

    // retrying works again (not blocked by a 1h window)
    fetchMock.mockResolvedValueOnce({ ok: true });
    const second = await request(app)
      .post("/api-v1/auth/login")
      .send({ email: user.email, password: "whatever-is-not-checked-here" });
    expect(second.status).toBe(200);
    expect(await Verification.countDocuments({ userId: user._id })).toBe(1);
  });

  test("successful resend from login returns 200 with a verification doc", async () => {
    const user = await User.create({
      name: "Successful Resend",
      email: "expiry-resend-ok@test.local",
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: false,
    });

    fetchMock.mockResolvedValueOnce({ ok: true });
    const res = await request(app)
      .post("/api-v1/auth/login")
      .send({ email: user.email, password: "does-not-matter-for-resend" });
    expect(res.status).toBe(200);
    expect(await Verification.countDocuments({ userId: user._id })).toBe(1);
  });
});
