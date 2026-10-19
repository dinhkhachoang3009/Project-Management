import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";

// Arcjet runs live email/MX checks and would 403 on fake test domains; the
// B6 contract is about the duplicate handling, not Arcjet — mock it before
// the app/module graph is imported (jest ESM: unstable_mockModule).
jest.unstable_mockModule("../libs/arcjet.js", () => ({
  default: {
    protect: async () => ({ isDenied: () => false }),
  },
}));

const { default: createApp } = await import("../app.js");
const { default: User } = await import("../models/user.js");
const { default: Verification } = await import("../models/verification.js");
const { startTestDb } = await import("./helpers/test-env.js");

const app = createApp();

// give the race's WINNING registration a deterministic sendEmail success
let fetchMock;

describe("POST /auth/register duplicate email (B6)", () => {
  let stopTestDb;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    fetchMock = jest.fn(async () => ({ ok: true }));
    globalThis.fetch = fetchMock;

    await User.create({
      name: "B6 First",
      email: "b6-first@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
    globalThis.fetch = undefined;
  });

  const register = (email, name = "B6 User") =>
    request(app).post("/api-v1/auth/register").send({
      name,
      email,
      password: "valid-password-123",
    });

  test("exact duplicate → 400 'Email address already exists' (pre-check path)", async () => {
    const res = await register("b6-first@test.local", "B6 Duplicate");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Email address already exists" });
  });

  test("concurrent duplicate → loser gets 400 'Email address already exists', not 500", async () => {
    // Both pre-checks must miss before User.create runs for the race to
    // surface E11000 — firing in parallel makes that near-certain (RED here).
    const [r1, r2] = await Promise.all([
      register("b6-race@test.local", "B6 Race A"),
      register("b6-race@test.local", "B6 Race B"),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 400]);

    const loser = r1.status === 201 ? r2 : r1;
    expect(loser.body).toEqual({ message: "Email address already exists" });

    expect(await User.countDocuments({ email: "b6-race@test.local" })).toBe(1);
  });

  test("the duplicate attempts created nothing (no user, no verification row)", async () => {
    const beforeUsers = await User.countDocuments();
    const beforeVerifs = await Verification.countDocuments();

    await register("B6-FIRST@test.local", "B6 Again");

    expect(await User.countDocuments()).toBe(beforeUsers);
    expect(await Verification.countDocuments()).toBe(beforeVerifs);
  });
});
