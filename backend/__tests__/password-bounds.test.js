import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import { startTestDb, TEST_JWT_SECRET, DUMMY_BCRYPT_HASH } from "./helpers/test-env.js";
import createApp from "../app.js";
import User from "../models/user.js";
import {
  registerSchema,
  resetPasswordSchema,
} from "../libs/validate-schema.js";

const app = createApp();

const LONG_80 = "x".repeat(80);

describe("Password bounds (A10)", () => {
  let stopTestDb;
  let user;
  let bearer;

  // each change-password test gets its OWN user — they mutate the password
  const newUserWithDummyHash = async (email) => {
    const u = await User.create({
      name: "Bounds User",
      email,
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: true,
    });
    return `Bearer ${jwt.sign({ userId: u._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;
  };

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    user = await User.create({
      name: "Bounds Base",
      email: "bounds-base@test.local",
      password: DUMMY_BCRYPT_HASH,
      isEmailVerified: true,
    });
    bearer = `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  // register/reset bounds are unit-tested on the zod schemas directly —
  // driving them through HTTP would run the Arcjet network call on the
  // pre-fix RED run.

  test("register password rejects 80 chars (max 72)", () => {
    const result = registerSchema.safeParse({
      name: "Long Pass",
      email: "bounds-register@test.local",
      password: LONG_80,
    });
    expect(result.success).toBe(false);
  });

  test("register password accepts 8-72 chars", () => {
    const result = registerSchema.safeParse({
      name: "Ok Pass",
      email: "bounds-register2@test.local",
      password: "ValidBoundPass1",
    });
    expect(result.success).toBe(true);
  });

  test("reset newPassword rejects 80 chars (max 72)", () => {
    const result = resetPasswordSchema.safeParse({
      token: "sometoken",
      newPassword: LONG_80,
      confirmPassword: LONG_80,
    });
    expect(result.success).toBe(false);
  });

  test("change-password with 7-char newPassword returns 400", async () => {
    const res = await request(app)
      .put("/api-v1/users/change-password")
      .set("Authorization", await newUserWithDummyHash("bounds-7char@test.local"))
      .send({
        currentPassword: "dummy-password-for-tests",
        newPassword: "short7",
        confirmPassword: "short7",
      });
    expect(res.status).toBe(400);
  });

  test("change-password with 80-char newPassword returns 400", async () => {
    const res = await request(app)
      .put("/api-v1/users/change-password")
      .set("Authorization", await newUserWithDummyHash("bounds-80char@test.local"))
      .send({
        currentPassword: "dummy-password-for-tests",
        newPassword: LONG_80,
        confirmPassword: LONG_80,
      });
    expect(res.status).toBe(400);
  });

  test("change-password with a valid 8-72 password returns 200", async () => {
    const res = await request(app)
      .put("/api-v1/users/change-password")
      .set("Authorization", await newUserWithDummyHash("bounds-valid@test.local"))
      .send({
        currentPassword: "dummy-password-for-tests",
        newPassword: "ValidBoundPass1",
        confirmPassword: "ValidBoundPass1",
      });
    expect(res.status).toBe(200);
  });
});
