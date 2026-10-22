process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

process.env.JWT_SECRET = TEST_JWT_SECRET;

const sendEmail = jest.fn(async () => true);

jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: async () => ({ isDenied: () => false }) },
}));
jest.unstable_mockModule("../libs/send-email.js", () => ({
  __esModule: true,
  sendEmail: (...args) => sendEmail(...args),
}));

const { default: createApp } = await import("../app.js");
const { default: request } = await import("supertest");
const mongoose = await import("mongoose");
const bcrypt = await import("bcrypt");
const { startTestDb } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");
const { default: Verification } = await import("../models/verification.js");

const app = createApp();
const agent = request(app);

const EMAIL = "authflows@test.local";
const PASSWORD = "KnownPass123";

const tokenFromEmailCall = () => {
  const html = sendEmail.mock.calls.at(-1)[2];
  return /token=([^"<]+)/.exec(html)[1];
};

describe("auth flows (H2b)", () => {
  let stopTestDb;
  let verifiedUser;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    verifiedUser = await User.create({
      name: "Auth Flows",
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("login success: token is HS256 {userId} without purpose; user hashes nothing", async () => {
    const res = await agent
      .post("/api-v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    const payload = jwt.verify(res.body.token, TEST_JWT_SECRET, {
      algorithms: ["HS256"],
    });
    expect(payload.userId).toBe(String(verifiedUser._id));
    expect(payload.purpose).toBeUndefined();

    expect(res.body.user.email).toBe(EMAIL);
    expect(res.body.user).not.toHaveProperty("password");
  });

  test("login wrong password and unknown email share one message", async () => {
    const wrongPw = await agent
      .post("/api-v1/auth/login")
      .send({ email: EMAIL, password: "Nope12345" });
    expect(wrongPw.status).toBe(401);
    expect(wrongPw.body.message).toBe("Invalid email or password");

    const ghost = await agent
      .post("/api-v1/auth/login")
      .send({ email: "ghost-h2b@test.local", password: "Nope12345" });
    expect(ghost.status).toBe(401);
    expect(ghost.body.message).toBe("Invalid email or password");
  });

  test("unverified user with NO verification row: auto-resend 200 (A13)", async () => {
    await User.create({
      name: "Unverified Fresh",
      email: "unv-fresh-h2b@test.local",
      password: await bcrypt.hash(PASSWORD, 10),
      isEmailVerified: false,
    });

    sendEmail.mockClear();
    const res = await agent
      .post("/api-v1/auth/login")
      .send({ email: "unv-fresh-h2b@test.local", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verification email sent/i);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const row = await Verification.findOne({
      userId: (await User.findOne({ email: "unv-fresh-h2b@test.local" }))._id,
    });
    expect(row).toBeTruthy();
  });

  test("unverified user with live verification: blocked 400 (A13 resend window)", async () => {
    const unv = await User.create({
      name: "Unverified Live",
      email: "unv-live-h2b@test.local",
      password: await bcrypt.hash(PASSWORD, 10),
      isEmailVerified: false,
    });
    await Verification.create({
      userId: unv._id,
      token: "live-token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await agent
      .post("/api-v1/auth/login")
      .send({ email: "unv-live-h2b@test.local", password: PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not verified/i);
  });

  test("unverified user with EXPIRED verification: token renewed, old row replaced", async () => {
    const unv = await User.create({
      name: "Unverified Expired",
      email: "unv-exp-h2b@test.local",
      password: await bcrypt.hash(PASSWORD, 10),
      isEmailVerified: false,
    });
    await Verification.create({
      userId: unv._id,
      token: "stale-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    sendEmail.mockClear();
    const res = await agent
      .post("/api-v1/auth/login")
      .send({ email: "unv-exp-h2b@test.local", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verification email sent/i);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const rows = await Verification.find({ userId: unv._id });
    expect(rows).toHaveLength(1);
    expect(String(rows[0].token)).not.toBe("stale-token");
    expect(String(rows[0].userId)).toBe(String(unv._id));
  });

  test("reset-request answers the SAME generic message for known and unknown emails (A9)", async () => {
    const known = await agent
      .post("/api-v1/auth/reset-password-request")
      .send({ email: EMAIL });
    expect(known.status).toBe(200);

    const unknown = await agent
      .post("/api-v1/auth/reset-password-request")
      .send({ email: "ghost-h2b@test.local" });
    expect(unknown.status).toBe(200); // anti-enumeration
  });

  test("happy reset: mismatch confirm 400; matching 200; new password lives", async () => {
    sendEmail.mockClear();
    await agent
      .post("/api-v1/auth/reset-password-request")
      .send({ email: EMAIL });
    const token = tokenFromEmailCall();

    const mismatch = await agent.post("/api-v1/auth/reset-password").send({
      token,
      newPassword: "ResetPass123",
      confirmPassword: "Different123",
    });
    expect(mismatch.status).toBe(400);

    const ok = await agent.post("/api-v1/auth/reset-password").send({
      token,
      newPassword: "ResetPass123",
      confirmPassword: "ResetPass123",
    });
    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe("Password reset successfully");

    const freshLogin = await agent
      .post("/api-v1/auth/login")
      .send({ email: EMAIL, password: "ResetPass123" });
    expect(freshLogin.status).toBe(200);
    expect(freshLogin.body.token).toBeTruthy();

    const deadPw = await agent
      .post("/api-v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    expect(deadPw.status).toBe(401);
  });
});
