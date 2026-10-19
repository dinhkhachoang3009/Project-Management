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

const settle = () => new Promise((r) => setTimeout(r, 50));

describe("deleteComment removes its activity rows (B7)", () => {
  let stopTestDb;
  let author;
  let workspace;
  let project;
  let task;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    author = await createUser("B7 Author", "b7-author@test.local");
    workspace = await Workspace.create({
      name: "B7 Workspace",
      owner: author._id,
      members: [{ user: author._id, role: "owner" }],
    });
    project = await Project.create({
      title: "B7 Project",
      workspace: workspace._id,
      createdBy: author._id,
      members: [{ user: author._id, role: "manager" }],
    });
    task = await Task.create({
      title: "B7 Task",
      project: project._id,
      createdBy: author._id,
      assignees: [author._id],
    });
    // a comment whose activity must survive
    const survivor = await Comment.create({ task: task._id, author: author._id, text: "survivor" });
    await ActivityLog.create({
      user: author._id,
      action: "added_comment",
      resourceType: "Comment",
      resourceId: survivor._id,
      details: {},
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("deleting a comment also deletes its added_comment activity rows", async () => {
    const create = await request(app)
      .post(`/api-v1/tasks/${task._id}/comments`)
      .set("Authorization", bearerFor(author))
      .send({ text: "delete me" });
    expect(create.status).toBe(201);
    await settle();

    const before = await ActivityLog.countDocuments({
      resourceType: "Comment",
      resourceId: create.body._id,
    });
    expect(before).toBeGreaterThanOrEqual(1); // recordActivity actually fired

    const del = await request(app)
      .delete(`/api-v1/tasks/comments/${create.body._id}`)
      .set("Authorization", bearerFor(author));
    expect(del.status).toBe(200);
    await settle();

    expect(await Comment.countDocuments({ _id: create.body._id })).toBe(0);
    expect(
      await ActivityLog.countDocuments({
        resourceType: "Comment",
        resourceId: create.body._id,
      })
    ).toBe(0);

    // the untouched comment's rows survive
    const survivor = await Comment.findOne({ text: "survivor" });
    expect(
      await ActivityLog.countDocuments({
        resourceType: "Comment",
        resourceId: survivor._id,
      })
    ).toBeGreaterThanOrEqual(1);
  });
});
