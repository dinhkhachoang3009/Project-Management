process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

process.env.JWT_SECRET = TEST_JWT_SECRET;

const protect = jest.fn();

jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: (...args) => protect(...args) },
}));
jest.unstable_mockModule("../libs/send-email.js", () => ({
  __esModule: true,
  sendEmail: async () => true,
}));

// helpers import AFTER mocks so the app chain resolves them mocked
const { default: createApp } = await import("../app.js");
const { default: callsMW } = await import("supertest");
const mongoose = await import("mongoose");
const { startTestDb } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");
const { default: Verification } = await import("../models/verification.js");

const app = createApp();
const request = callsMW(app);

describe("login/reset rate limit guard (G6)", () => {
  let stopTestDb;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("denied login short-circuits 429 before ANY db access", async () => {
    protect.mockClear().mockResolvedValue({ isDenied: () => true });
    const rawFindOne = User.findOne.bind(User);
    let findOneCalled = false;
    User.findOne = (...args) => {
      findOneCalled = true;
      return rawFindOne(...args);
    };
    try {
      const res = await request
        .post("/api-v1/auth/login")
        .send({ email: "somebody@test.local", password: "whateverPass1" });
      expect(res.status).toBe(429);
      expect(res.body.message).toBe(
        "Too many requests. Please try again later."
      );
      expect(findOneCalled).toBe(false);
    } finally {
      User.findOne = rawFindOne;
    }
  });

  test("allowed login proceeds to the normal 401 invalid-creds path", async () => {
    protect.mockClear().mockResolvedValue({ isDenied: () => false });

    const res = await request
      .post("/api-v1/auth/login")
      .send({ email: "nobody-g6@test.local", password: "whateverPass1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(protect).toHaveBeenCalled();
  });

  test("denied reset-password-request 429s without touching Verification", async () => {
    protect.mockClear().mockResolvedValue({ isDenied: () => true });

    const countBefore = await Verification.countDocuments({});
    const res = await request
      .post("/api-v1/auth/reset-password-request")
      .send({ email: "somebody@test.local" });

    expect(res.status).toBe(429);
    expect(await Verification.countDocuments({})).toBe(countBefore);
  });

  test("arcjet EMAIL verdict denies register with the original 403 contract", async () => {
    protect.mockClear().mockResolvedValue({
      isDenied: () => true,
      reason: { type: "EMAIL" },
    });

    const res = await request
      .post("/api-v1/auth/register")
      .send({
        name: "Tester G6",
        email: "someone@disposable.test",
        password: "KnownPass123",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid email address");
  });

  test("RATE_LIMIT verdict still answers 429 with the pinned message", async () => {
    protect.mockClear().mockResolvedValue({
      isDenied: () => true,
      reason: { type: "RATE_LIMIT" },
    });

    const res = await request
      .post("/api-v1/auth/login")
      .send({ email: "somebody@test.local", password: "KnownPass123" });

    expect(res.status).toBe(429);
    expect(res.body.message).toBe("Too many requests. Please try again later.");
  });

  test("guard errors fail CLOSED with a 503 (review finding 1)", async () => {
    protect.mockClear().mockRejectedValue(new Error("arcjet down"));
    const rawFindOne = User.findOne.bind(User);
    let findOneCalled = false;
    User.findOne = (...args) => {
      findOneCalled = true;
      return rawFindOne(...args);
    };
    try {
      const res = await request
        .post("/api-v1/auth/login")
        .send({ email: "somebody@test.local", password: "KnownPass123" });

      expect(res.status).toBe(503);
      expect(res.body.message).toBe("Service temporarily unavailable.");
      expect(findOneCalled).toBe(false);
    } finally {
      User.findOne = rawFindOne;
    }
  });
});
