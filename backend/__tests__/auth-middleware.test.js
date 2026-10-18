import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import { startTestDb, TEST_JWT_SECRET } from "./helpers/test-env.js";

const app = createApp();

describe("Auth middleware (real app stack)", () => {
  let stopTestDb;
  let member;
  let nonMember;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    member = await User.create({
      name: "Member User",
      email: "middleware-member@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL" ,
      isEmailVerified: true,
    });
    nonMember = await User.create({
      name: "NonMember User",
      email: "middleware-nonmember@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("protected route without token returns 401", async () => {
    const res = await request(app).get("/api-v1/workspaces");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  test("accepts a session token without purpose claim", async () => {
    const tok = jwt.sign({ userId: member._id }, TEST_JWT_SECRET, {
      expiresIn: "1d",
    });
    const res = await request(app)
      .get("/api-v1/workspaces")
      .set("Authorization", `Bearer ${tok}`);
    expect(res.status).toBe(200);
  });

  test("rejects an email-verification token used as Bearer", async () => {
    const tok = jwt.sign(
      { userId: nonMember._id, purpose: "email-verification" },
      TEST_JWT_SECRET,
      { expiresIn: "1h" },
    );
    const res = await request(app)
      .get("/api-v1/workspaces")
      .set("Authorization", `Bearer ${tok}`);
    expect(res.status).toBe(401);
  });

  test("rejects a reset-password token used as Bearer", async () => {
    const tok = jwt.sign(
      { userId: nonMember._id, purpose: "reset-password" },
      TEST_JWT_SECRET,
      { expiresIn: "1h" },
    );
    const res = await request(app)
      .get("/api-v1/workspaces")
      .set("Authorization", `Bearer ${tok}`);
    expect(res.status).toBe(401);
  });

  test("rejects token signed with HS512", async () => {
    const tok = jwt.sign({ userId: member._id }, TEST_JWT_SECRET, {
      algorithm: "HS512",
      expiresIn: "1d",
    });
    const res = await request(app)
      .get("/api-v1/workspaces")
      .set("Authorization", `Bearer ${tok}`);
    expect(res.status).toBe(401);
  });
});
