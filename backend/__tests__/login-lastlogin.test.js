process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

process.env.JWT_SECRET = TEST_JWT_SECRET;

jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: async () => ({ isDenied: () => false }) },
}));

const { default: createApp } = await import("../app.js");
const { default: request } = await import("supertest");
const mongoose = await import("mongoose");
const bcrypt = await import("bcrypt");
const { startTestDb } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");

const app = createApp();

describe("login lastLogin targeted update (G13)", () => {
  let stopTestDb;
  let user;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    user = await User.create({
      name: "G13 User",
      email: "g13@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("successful login uses a $set update, never a full-doc save()", async () => {
    const originalUpdate = User.findByIdAndUpdate;
    const originalSave = User.prototype.save;
    let updateArgs = null;
    let saveCalled = false;
    User.findByIdAndUpdate = (id, patch, opts) => {
      updateArgs = [id, patch];
      return originalUpdate.call(User, id, patch, opts);
    };
    User.prototype.save = function (...args) {
      saveCalled = true;
      return originalSave.apply(this, args);
    };

    try {
      const res = await request(app)
        .post("/api-v1/auth/login")
        .send({ email: "g13@test.local", password: "KnownPass123" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user.email).toBe("g13@test.local");

      expect(saveCalled).toBe(false);
      expect(updateArgs).toBeTruthy();
      expect(String(updateArgs[0])).toBe(String(user._id));
      expect(updateArgs[1]).toHaveProperty("$set.lastLogin");
    } finally {
      User.findByIdAndUpdate = originalUpdate;
      User.prototype.save = originalSave;
    }
  });
});
