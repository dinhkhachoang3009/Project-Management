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

describe("task/project creation registers refs in their parents", () => {
  let stopTestDb;
  let manager;
  let workspace;
  let project;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    manager = await createUser("B4 Manager", "b4-manager@test.local");
    workspace = await Workspace.create({
      name: "B4 Workspace",
      owner: manager._id,
      members: [{ user: manager._id, role: "owner" }],
    });
    project = await Project.create({
      title: "B4 Project",
      workspace: workspace._id,
      createdBy: manager._id,
      members: [{ user: manager._id, role: "manager" }],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("creating a task registers it in project.tasks", async () => {
    const res = await request(app)
      .post(`/api-v1/tasks/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({ title: "Ref Task" });
    expect(res.status).toBe(201);

    const fresh = await Project.findById(project._id);
    expect(fresh.tasks.map(String)).toContain(res.body._id);
  });

  test("creating a project registers it in workspace.projects", async () => {
    const res = await request(app)
      .post(`/api-v1/projects/${workspace._id}/create-project`)
      .set("Authorization", bearerFor(manager))
      .send({
        title: "Ref Project",
        status: "Planning",
        startDate: "2026-01-01",
        dueDate: "2026-12-31",
      });
    expect(res.status).toBe(201);

    const fresh = await Workspace.findById(workspace._id);
    expect(fresh.projects.map(String)).toContain(res.body._id);
  });

  test("5 concurrent task creates all register (atomic $push, no dropped refs)", async () => {
    // The read-modify-write race may not deterministically drop refs in one
    // test run — this pins the contract; the fix's correctness is the $push.
    const created = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post(`/api-v1/tasks/${project._id}`)
          .set("Authorization", bearerFor(manager))
          .send({ title: `Concurrent Task ${i}` })
      )
    );
    expect(created.map((r) => r.status)).toEqual([201, 201, 201, 201, 201]);

    const fresh = await Project.findById(project._id).lean();
    const ids = new Set(fresh.tasks.map(String));
    for (const r of created) {
      expect(ids.has(r.body._id)).toBe(true);
    }
    // no duplicates and nothing dropped
    expect(fresh.tasks.length).toBe(new Set(fresh.tasks.map(String)).size);
    expect(fresh.tasks.length).toBe(6); // 1 from the first test + 5
  });
});
