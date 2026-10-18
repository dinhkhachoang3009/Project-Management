import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import { startTestDb, TEST_JWT_SECRET } from "./helpers/test-env.js";

const app = createApp();

async function createUser(name, email) {
  return User.create({
    name,
    email,
    password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
    isEmailVerified: true,
  });
}

// Shared fixture pattern: owner + member + outsider + workspace embedding
// members: [{ user, role, joinedAt }]. Later suites create additional
// children (projects, tasks) the same way.
describe("GET /workspaces/:id (membership enforcement)", () => {
  let stopTestDb;
  let workspace;
  let owner;
  let member;
  let outsider;

  const bearerFor = (user) =>
    `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("Owner User", "ws-owner@test.local");
    member = await createUser("Member User", "ws-member@test.local");
    outsider = await createUser("Outsider User", "ws-outsider@test.local");

    workspace = await Workspace.create({
      name: "Security Test Workspace",
      description: "fixture workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: member._id, role: "member" },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("owner reads workspace details", async () => {
    const res = await request(app)
      .get(`/api-v1/workspaces/${workspace._id}`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(workspace._id));
  });

  test("member reads workspace details", async () => {
    const res = await request(app)
      .get(`/api-v1/workspaces/${workspace._id}`)
      .set("Authorization", bearerFor(member));
    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(2);
  });

  test("non-member gets 403, not workspace data", async () => {
    const res = await request(app)
      .get(`/api-v1/workspaces/${workspace._id}`)
      .set("Authorization", bearerFor(outsider));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "You are not a member of this workspace" });
  });

  test("unknown id returns 404", async () => {
    const res = await request(app)
      .get(`/api-v1/workspaces/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(404);
  });
});
