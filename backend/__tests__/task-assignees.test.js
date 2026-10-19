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

const bearerFor = (user) =>
  `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

describe("task assignee validation (B3b, D4 = project members only)", () => {
  let stopTestDb;
  let manager;
  let contributor;
  let viewer;
  let outsider;
  let workspace;
  let project;
  let task;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    manager = await createUser("B3b Manager", "b3b-manager@test.local");
    contributor = await createUser("B3b Contributor", "b3b-contrib@test.local");
    viewer = await createUser("B3b Viewer", "b3b-viewer@test.local");
    outsider = await createUser("B3b Outsider", "b3b-outsider@test.local");

    workspace = await Workspace.create({
      name: "B3b Workspace",
      owner: manager._id,
      members: [
        { user: manager._id, role: "owner" },
        { user: contributor._id, role: "member" },
        { user: viewer._id, role: "member" },
        { user: outsider._id, role: "member" },
      ],
    });

    project = await Project.create({
      title: "B3b Project",
      workspace: workspace._id,
      createdBy: manager._id,
      members: [
        { user: manager._id, role: "manager" },
        { user: contributor._id, role: "contributor" },
        { user: viewer._id, role: "viewer" },
      ],
    });

    task = await Task.create({
      title: "B3b Task",
      project: project._id,
      createdBy: manager._id,
      assignees: [manager._id],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("create: valid member assignee → 201, creator auto-added once", async () => {
    const res = await request(app)
      .post(`/api-v1/tasks/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({ title: "Valid Assignees", assignees: [contributor._id.toString()] });
    expect(res.status).toBe(201);
    const ids = res.body.assignees.map(String);
    expect(ids).toContain(contributor._id.toString());
    expect(ids.filter((id) => id === manager._id.toString())).toHaveLength(1);
  });

  test("create: watcher/outside-project user id → 400 + task not created", async () => {
    const res = await request(app)
      .post(`/api-v1/tasks/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({ title: "Bad Assignees", assignees: [outsider._id.toString()] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Assignees must be members of this project",
    });
    expect(await Task.countDocuments({ project: project._id, title: "Bad Assignees" })).toBe(0);
  });

  test("create: nonexistent user id as assignee → 400", async () => {
    const res = await request(app)
      .post(`/api-v1/tasks/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({
        title: "Ghost Assignee",
        assignees: [new mongoose.Types.ObjectId().toString()],
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Assignees must be members of this project",
    });
  });

  test("create: viewer may be assigned (D4: any project role)", async () => {
    const res = await request(app)
      .post(`/api-v1/tasks/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({ title: "Viewer Assignee", assignees: [viewer._id.toString()] });
    expect(res.status).toBe(201);
    expect(res.body.assignees.map(String)).toContain(viewer._id.toString());
  });

  test("update: outsider assignee → 400, assignees unchanged", async () => {
    const res = await request(app)
      .put(`/api-v1/tasks/${task._id}/assignees`)
      .set("Authorization", bearerFor(manager))
      .send({ assignees: [outsider._id.toString()] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Assignees must be members of this project",
    });

    const fresh = await Task.findById(task._id);
    expect(fresh.assignees.map(String)).toEqual([manager._id.toString()]);
  });

  test("update: empty assignees → 200 (unassign allowed)", async () => {
    const res = await request(app)
      .put(`/api-v1/tasks/${task._id}/assignees`)
      .set("Authorization", bearerFor(manager))
      .send({ assignees: [] });
    expect(res.status).toBe(200);

    const fresh = await Task.findById(task._id);
    expect(fresh.assignees).toHaveLength(0);
  });
});
