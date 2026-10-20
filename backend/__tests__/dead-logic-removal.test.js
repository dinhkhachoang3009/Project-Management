import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import ActivityLog from "../models/activity.js";
import { startTestDb } from "./helpers/test-env.js";

const app = createApp();

const oid = () => new mongoose.Types.ObjectId();

const logBody = (action) => ({
  user: oid(),
  action,
  resourceType: "Workspace",
  resourceId: oid(),
});

const DEAD_ACTIONS = [
  "added_member",
  "removed_member",
  "transferred_workspace_ownership",
  "added_attachment",
  "completed_project",
];

const LIVE_ACTIONS = ["added_comment", "completed_task", "updated_subtask"];

describe("dead logic removal (C5)", () => {
  let stopTestDb;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    await ActivityLog.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  describe("activity enum: the 5 never-recorded actions are gone from the schema", () => {
    for (const action of DEAD_ACTIONS) {
      test(`${action} → ValidationError`, async () => {
        await expect(ActivityLog.create(logBody(action))).rejects.toThrow(
          "is not a valid enum value"
        );
      });
    }
  });

  describe("activity enum: verified-produced actions stay", () => {
    for (const action of LIVE_ACTIONS) {
      test(`${action} still saves`, async () => {
        const doc = await ActivityLog.create(logBody(action));
        expect(doc.action).toBe(action);
      });
    }
  });

  test("generic PUT /tasks/:id route removed → 404 not 401/500", async () => {
    const res = await request(app)
      .put(`/api-v1/tasks/${oid()}`)
      .send({ title: "x", description: "y" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Not found" });
  });

  test("user schema has no 2FA paths", () => {
    expect(User.schema.path("is2FAEnabled")).toBeUndefined();
    expect(User.schema.path("twoFAOtp")).toBeUndefined();
    expect(User.schema.path("twoFAOtpExpires")).toBeUndefined();
  });
});
