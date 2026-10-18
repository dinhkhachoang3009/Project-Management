import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp, { assertProductionFrontendUrl } from "../app.js";
import { startTestDb } from "./helpers/test-env.js";

const app = createApp();

describe("Security headers + CORS (A12)", () => {
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

  test("response carries helmet security headers", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("CORS preflight allows PATCH", async () => {
    const res = await request(app)
      .options("/api-v1/workspaces")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PATCH");
    const methods = res.headers["access-control-allow-methods"] || "";
    expect(methods.split(",").map((m) => m.trim())).toContain("PATCH");
  });

  test("production without FRONTEND_URL fails fast", () => {
    expect(() =>
      assertProductionFrontendUrl({ NODE_ENV: "production" }),
    ).toThrow();
    expect(() => assertProductionFrontendUrl({ NODE_ENV: "test" })).not.toThrow();
    expect(() =>
      assertProductionFrontendUrl({
        NODE_ENV: "production",
        FRONTEND_URL: "https://app.example.com",
      }),
    ).not.toThrow();
  });
});
