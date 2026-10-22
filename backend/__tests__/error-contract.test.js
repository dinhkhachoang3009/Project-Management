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
const { startTestDb } = await import("./helpers/test-env.js");

const app = createApp();

describe("error contract {message} (G7)", () => {
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

  test("zod schema failures answer 400 {message} — not the {type, errors} shape", async () => {
    const res = await request(app)
      .post("/api-v1/auth/login")
      .send({ email: "not-an-email", password: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message).not.toEqual("");
    expect(res.body).not.toHaveProperty("errors");
    expect(res.body).not.toHaveProperty("type");
  });

  test("malformed JSON answers 400 {message}", async () => {
    const res = await request(app)
      .post("/api-v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "broken json');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("oversized bodies (>100kb) answer 413 {message}", async () => {
    const big = { x: "y".repeat(101 * 1024) };
    const res = await request(app)
      .post("/api-v1/auth/login")
      .set("Content-Type", "application/json")
      .send(big);
    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty("message");
  });

  test("unknown paths answer 404 {message} after the error middleware", async () => {
    const res = await request(app).get("/api-v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Not found" });
  });
});
