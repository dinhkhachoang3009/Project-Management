import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
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

describe("GET /tasks/my-tasks (archived tasks included)", () => {
  let stopTestDb;
  let me;
  let other;
  let workspace;
  let project;
  let activeTask;
  let archivedTask;
  let othersTask;

  const bearerFor = (user) =>
    `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    me = await createUser("My Tasks Me", "b1-me@test.local");
    other = await createUser("My Tasks Other", "b1-other@test.local");

    workspace = await Workspace.create({
      name: "B1 Workspace",
      owner: me._id,
      members: [
        { user: me._id, role: "owner" },
        { user: other._id, role: "member" },
      ],
    });

    project = await Project.create({
      title: "B1 Project",
      workspace: workspace._id,
      createdBy: me._id,
      members: [{ user: me._id, role: "manager" }],
    });

    activeTask = await Task.create({
      title: "Active Task",
      project: project._id,
      createdBy: me._id,
      assignees: [me._id],
    });

    archivedTask = await Task.create({
      title: "Archived Task",
      project: project._id,
      createdBy: me._id,
      assignees: [me._id],
      isArchived: true,
    });

    othersTask = await Task.create({
      title: "Others Task",
      project: project._id,
      createdBy: other._id,
      assignees: [other._id],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("my-tasks returns both active and archived tasks assigned to me", async () => {
    const res = await request(app)
      .get("/api-v1/tasks/my-tasks")
      .set("Authorization", bearerFor(me));
    expect(res.status).toBe(200);
    const titles = res.body.map((t) => t.title);
    expect(titles).toContain("Active Task");
    expect(titles).toContain("Archived Task");
  });

  test("tasks assigned to other users are not returned", async () => {
    const res = await request(app)
      .get("/api-v1/tasks/my-tasks")
      .set("Authorization", bearerFor(me));
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).not.toContain("Others Task");
  });

  test("getProjectTasks still excludes archived (unchanged contract)", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/project/${project._id}`)
      .set("Authorization", bearerFor(me));
    expect(res.status).toBe(200);
    const titles = res.body.tasks.map((t) => t.title);
    expect(titles).toContain("Active Task");
    expect(titles).not.toContain("Archived Task");
  });
});
