import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import { startTestDb, TEST_JWT_SECRET } from "./helpers/test-env.js";

const app = createApp();

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL";

async function createUser(name, email) {
  return User.create({
    name,
    email,
    password: DUMMY_HASH,
    isEmailVerified: true,
  });
}

describe("Workspace invite links (token-gated join, D3)", () => {
  let stopTestDb;
  let owner;
  let admin;
  let plainMember;
  let joinerA;
  let joinerB;
  let outsider;
  let rawLinkUser;
  let workspace;

  const bearerFor = (user) =>
    `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("Link Owner", "link-owner@test.local");
    admin = await createUser("Link Admin", "link-admin@test.local");
    plainMember = await createUser("Plain Member", "link-member@test.local");
    joinerA = await createUser("Joiner A", "link-joiner-a@test.local");
    joinerB = await createUser("Joiner B", "link-joiner-b@test.local");
    outsider = await createUser("Link Outsider", "link-outsider@test.local");
    rawLinkUser = await createUser(
      "Raw Link User",
      "link-raw@test.local",
    );

    workspace = await Workspace.create({
      name: "Link Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: admin._id, role: "admin" },
        { user: plainMember._id, role: "member" },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("owner creates an invite link with a token", async () => {
    const res = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "member" });
    expect(res.status).toBe(200);
    expect(res.body.link).toContain("/workspace-invite/");
    expect(res.body.link).toContain("tk=");
  });

  test("renaming default: viewer role is honored in the generated link", async () => {
    const res = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "viewer", regenerate: true });
    expect(res.status).toBe(200);

    const joined = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(joinerA))
      .send({ token: new URL(res.body.link).searchParams.get("tk") });
    expect(joined.status).toBe(200);

    const ws = await Workspace.findById(workspace._id).lean();
    const row = ws.members.find(
      (m) => String(m.user) === String(joinerA._id),
    );
    expect(row.role).toBe("viewer");
  });

  test("link role 'admin' is rejected (anyone-with-the-link must not mint admins)", async () => {
    const res = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "admin" });
    expect(res.status).toBe(400);
  });

  test("creating a link again without `regenerate` returns the SAME active link", async () => {
    const first = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({});
    const second = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({});
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.link).toBe(first.body.link);
  });

  test("plain member cannot create invite links", async () => {
    const res = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(plainMember))
      .send({ role: "member" });
    expect(res.status).toBe(403);
  });

  test("the same link token joins a second user (multi-use)", async () => {
    // joinerA already used it above via the viewer test; generate one and use twice
    const gen = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "member" });
    const tk = new URL(gen.body.link).searchParams.get("tk");

    const first = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(joinerB))
      .send({ token: tk });
    expect(first.status).toBe(200);

    const doc = await WorkspaceInvite.findOne({ type: "link", token: tk });
    expect(doc).not.toBeNull();

    // unknown workspace user reuse path: a new user joins with the same token
    const fresh = await createUser("Joiner C", "link-joiner-c@test.local");
    const second = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(fresh))
      .send({ token: tk });
    expect(second.status).toBe(200);
  });

  test("regenerating revokes the previous link token", async () => {
    const oldLink = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({});
    const oldTk = new URL(oldLink.body.link).searchParams.get("tk");

    const regenerated = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(admin))
      .send({ regenerate: true });
    expect(regenerated.status).toBe(200);
    const newTk = new URL(regenerated.body.link).searchParams.get("tk");
    expect(newTk).not.toBe(oldTk);

    const freshJoiner = await createUser(
      "Joiner D",
      "link-joiner-d@test.local",
    );
    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(freshJoiner))
      .send({ token: oldTk });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Invitation not found");
  });

  test("expired link doc rejects with 400", async () => {
    const gen = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "member" });
    const tk = new URL(gen.body.link).searchParams.get("tk");

    // force the doc's expiry into the past (JWT itself is still 7d-valid)
    await WorkspaceInvite.updateOne(
      { type: "link", token: tk },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const freshJoiner = await createUser(
      "Joiner E",
      "link-joiner-e-should-not-join@test.local",
    );
    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(freshJoiner))
      .send({ token: tk });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invitation has expired");
  });

  test("garbage token yields a clean 4xx and joins nobody", async () => {
    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(outsider))
      .send({ token: "not-a-real-token" });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const ws = await Workspace.findById(workspace._id).lean();
    expect(
      ws.members.some((m) => String(m.user) === String(outsider._id)),
    ).toBe(false);
  });

  test("old raw link (no token) is rejected — open join closed", async () => {
    const res = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/accept-generate-invite`)
      .set("Authorization", bearerFor(rawLinkUser))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Invalid invite link. Please use the link shared by a workspace admin.",
    );

    const ws = await Workspace.findById(workspace._id).lean();
    expect(
      ws.members.some((m) => String(m.user) === String(rawLinkUser._id)),
    ).toBe(false);
  });

  test("email invite flow still accepts and deletes its doc", async () => {
    const emailInviteToken = jwt.sign(
      { user: outsider._id, workspaceId: workspace._id, role: "member" },
      TEST_JWT_SECRET,
      { expiresIn: "7d" },
    );
    await WorkspaceInvite.create({
      type: "email",
      user: outsider._id,
      workspaceId: workspace._id,
      token: emailInviteToken,
      role: "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(outsider))
      .send({ token: emailInviteToken });
    expect(res.status).toBe(200);

    const ws = await Workspace.findById(workspace._id).lean();
    expect(ws.members.some((m) => String(m.user) === String(outsider._id))).toBe(
      true,
    );
    expect(
      await WorkspaceInvite.findOne({ token: emailInviteToken }),
    ).toBeNull();
  });

  test("already-member cannot consume an invite link again", async () => {
    const gen = await request(app)
      .post(`/api-v1/workspaces/${workspace._id}/invite-link`)
      .set("Authorization", bearerFor(owner))
      .send({ role: "member" });
    const tk = new URL(gen.body.link).searchParams.get("tk");

    const res = await request(app)
      .post("/api-v1/workspaces/accept-invite-token")
      .set("Authorization", bearerFor(joinerB))
      .send({ token: tk });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("You are already a member of this workspace");
  });
});
