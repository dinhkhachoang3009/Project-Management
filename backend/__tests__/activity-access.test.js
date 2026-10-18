import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import ActivityLog from "../models/activity.js";
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

describe("GET /tasks/:resourceId/activity (project membership enforcement)", () => {
  let stopTestDb;
  let owner;
  let projectMember;
  let outsider;
  let workspace;
  let project;
  let task;

  const bearerFor = (user) =>
    `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("Activity Owner", "act-owner@test.local");
    projectMember = await createUser("Activity Member", "act-member@test.local");
    outsider = await createUser("Activity Outsider", "act-outsider@test.local");

    workspace = await Workspace.create({
      name: "Activity Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: projectMember._id, role: "member" },
      ],
    });

    project = await Project.create({
      title: "Activity Project",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: projectMember._id, role: "manager" }],
    });

    task = await Task.create({
      title: "Audited Task",
      project: project._id,
      createdBy: owner._id,
    });

    await ActivityLog.create({
      user: projectMember._id,
      action: "created_task",
      resourceType: "Task",
      resourceId: task._id,
      details: { title: task.title },
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("project member reads task activity", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${task._id}/activity`)
      .set("Authorization", bearerFor(projectMember));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].action).toBe("created_task");
    expect(res.body[0].user.email).toBe("act-member@test.local");
  });

  test("non-member gets 403 and no activity rows", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${task._id}/activity`)
      .set("Authorization", bearerFor(outsider));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "You are not a member of this project",
    });
  });

  test("unknown resource returns 404", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${new mongoose.Types.ObjectId()}/activity`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(404);
  });
});
