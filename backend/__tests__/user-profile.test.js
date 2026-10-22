process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
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
const agent = request(app);

const authed = (t) => agent.get("/api-v1/users/profile").set("Authorization", `Bearer ${t}`);
const TOK = (id) => jwt.sign({ userId: id }, TEST_JWT_SECRET, { expiresIn: "1d" });
const jwtSign = TOK;

describe("user profile endpoints (H2a)", () => {
  let stopTestDb;
  let user;
  let token;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    user = await User.create({
      name: "Profile User",
      email: "profile-h2a@test.local",
      password: await bcrypt.hash("OldPass123", 10),
      isEmailVerified: true,
    });
    token = jwtSign(user._id);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("all three endpoints 401 without a token", async () => {
    expect((await request(app).get("/api-v1/users/profile")).status).toBe(401);
    expect(
      (await agent.put("/api-v1/users/profile").send({ name: "x" })).status
    ).toBe(401);
    expect(
      (
        await agent.put("/api-v1/users/change-password").send({})
      ).status
    ).toBe(401);
  });

  test("GET profile returns the user without the password hash", async () => {
    const res = await authed(token);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("profile-h2a@test.local");
    expect(res.body).not.toHaveProperty("password");
  });

  test("PUT profile persists name and profilePicture", async () => {
    const res = await agent
      .put("/api-v1/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Renamed Profile", profilePicture: "data:image/svg+xml;utf8,p" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed Profile");

    const re = await authed(token);
    expect(re.body.name).toBe("Renamed Profile");
    expect(re.body.profilePicture).toBe("data:image/svg+xml;utf8,p");
  });

  test("change-password: wrong old password answers 400 (post-G14)", async () => {
    const res = await agent
      .put("/api-v1/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "wrong-pass",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid old password");
  });

  test("change-password: confirm mismatch answers 400 before hashing", async () => {
    const res = await agent
      .put("/api-v1/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "Different123",
      });

    expect(res.status).toBe(400);
    // old password still works
    const login = await agent
      .post("/api-v1/auth/login")
      .send({ email: "profile-h2a@test.local", password: "OldPass123" });
    expect(login.status).toBe(200);
  });

  test("change-password happy path: new password works, old one dies", async () => {
    const res = await agent
      .put("/api-v1/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password updated successfully");

    const oldLogin = await agent
      .post("/api-v1/auth/login")
      .send({ email: "profile-h2a@test.local", password: "OldPass123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await agent
      .post("/api-v1/auth/login")
      .send({ email: "profile-h2a@test.local", password: "NewPass123" });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toBeTruthy();
  });
});
