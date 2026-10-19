import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import Comment from "../models/comment.js";
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

const bearerFor = (user) =>
  `Bearer ${jwt.sign({ userId: user._id }, TEST_JWT_SECRET, { expiresIn: "1d" })}`;

describe("cascade deletes (B2)", () => {
  let stopTestDb;
  let owner;
  let manager;
  let workspace;
  let projectA;
  let projectB;
  let taskA1;
  let taskA2;
  let taskB1;
  let commentA1;
  let commentB1;
  let keepWorkspaceId;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("B2 Owner", "b2-owner@test.local");
    manager = await createUser("B2 Manager", "b2-manager@test.local");

    // a workspace whose data must survive projectA's deletion
    keepWorkspaceId = owner._id; // placeholder, replaced below
    workspace = await Workspace.create({
      name: "B2 Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: manager._id, role: "admin" },
      ],
    });
    keepWorkspaceId = workspace._id;

    projectA = await Project.create({
      title: "B2 Project A",
      workspace: workspace._id,
      createdBy: manager._id,
      members: [
        { user: manager._id, role: "manager" },
        { user: owner._id, role: "contributor" },
      ],
    });
    projectB = await Project.create({
      title: "B2 Project B",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: owner._id, role: "manager" }],
    });

    taskA1 = await Task.create({ title: "A1", project: projectA._id, createdBy: manager._id });
    taskA2 = await Task.create({ title: "A2", project: projectA._id, createdBy: manager._id });
    taskB1 = await Task.create({ title: "B1", project: projectB._id, createdBy: owner._id });

    commentA1 = await Comment.create({ task: taskA1._id, author: manager._id, text: "c1" });
    commentB1 = await Comment.create({ task: taskB1._id, author: owner._id, text: "keep me" });

    // direct-seeded activity rows for every resource kind
    await ActivityLog.create({ user: manager._id, action: "created_project", resourceType: "Project", resourceId: projectA._id, details: {} });
    await ActivityLog.create({ user: manager._id, action: "created_task", resourceType: "Task", resourceId: taskA1._id, details: {} });
    await ActivityLog.create({ user: manager._id, action: "created_task", resourceType: "Task", resourceId: taskA2._id, details: {} });
    await ActivityLog.create({ user: manager._id, action: "added_comment", resourceType: "Comment", resourceId: commentA1._id, details: {} });
    // survivor rows: projectB + its task/comment + workspace-level
    await ActivityLog.create({ user: owner._id, action: "created_project", resourceType: "Project", resourceId: projectB._id, details: {} });
    await ActivityLog.create({ user: owner._id, action: "created_task", resourceType: "Task", resourceId: taskB1._id, details: {} });
    await ActivityLog.create({ user: owner._id, action: "created_workspace", resourceType: "Workspace", resourceId: workspace._id, details: {} });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("deleteProject as non-manager → 403, nothing deleted", async () => {
    const res = await request(app)
      .delete(`/api-v1/projects/${projectA._id}`)
      .set("Authorization", bearerFor(owner)); // owner is only a contributor here
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Only project manager can delete this project" });

    expect(await Task.countDocuments({ project: projectA._id })).toBe(2);
    expect(await ActivityLog.countDocuments({ resourceId: projectA._id })).toBe(1);
  });

  test("deleteProject as manager → 200; zero orphan tasks/comments/activity", async () => {
    const res = await request(app)
      .delete(`/api-v1/projects/${projectA._id}`)
      .set("Authorization", bearerFor(manager));
    expect(res.status).toBe(200);

    expect(await Task.countDocuments({ project: projectA._id })).toBe(0);
    expect(await Comment.countDocuments({ _id: commentA1._id })).toBe(0);
    expect(
      await ActivityLog.countDocuments({
        resourceId: { $in: [projectA._id, taskA1._id, taskA2._id, commentA1._id] },
      })
    ).toBe(0);

    // surgical: project B untouched
    expect(await Task.countDocuments({ project: projectB._id })).toBe(1);
    expect(await Comment.countDocuments({ _id: commentB1._id })).toBe(1);
    expect(await ActivityLog.countDocuments({ resourceId: taskB1._id })).toBe(1);

    const freshWs = await Workspace.findById(workspace._id);
    expect(freshWs.projects.map(String)).not.toContain(projectA._id.toString());
  });

  test("deleteWorkspace as non-owner (admin member) → 403, nothing deleted", async () => {
    const res = await request(app)
      .delete(`/api-v1/workspaces/${workspace._id}`)
      .set("Authorization", bearerFor(manager));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Only workspace owner can delete this workspace" });

    expect(await Project.countDocuments({ workspace: workspace._id })).toBe(1);
  });

  test("deleteWorkspace as owner → 200; zero orphans incl. workspace-level activity", async () => {
    const res = await request(app)
      .delete(`/api-v1/workspaces/${workspace._id}`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(200);

    expect(await Workspace.countDocuments({ _id: workspace._id })).toBe(0);
    expect(await Project.countDocuments({ workspace: workspace._id })).toBe(0);
    expect(await Task.countDocuments({ project: projectB._id })).toBe(0);
    expect(await Comment.countDocuments({ _id: commentB1._id })).toBe(0);
    expect(
      await ActivityLog.countDocuments({
        resourceId: { $in: [workspace._id, projectB._id, taskB1._id, commentB1._id] },
      })
    ).toBe(0);
  });
});
