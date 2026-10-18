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

describe("GET /tasks/:taskId/comments (project membership enforcement)", () => {
  let stopTestDb;
  let owner;
  let projectMember;
  let workspaceMemberOnly;
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

    owner = await createUser("Comment Owner", "cmt-owner@test.local");
    projectMember = await createUser("Project Member", "cmt-member@test.local");
    workspaceMemberOnly = await createUser(
      "Workspace Only",
      "cmt-wsonly@test.local",
    );
    outsider = await createUser("Outsider", "cmt-outsider@test.local");

    workspace = await Workspace.create({
      name: "Comments Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: projectMember._id, role: "member" },
        { user: workspaceMemberOnly._id, role: "member" },
      ],
    });

    project = await Project.create({
      title: "Comments Project",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [
        { user: projectMember._id, role: "manager" },
        { user: owner._id, role: "manager" },
      ],
    });

    task = await Task.create({
      title: "Commented Task",
      project: project._id,
      createdBy: owner._id,
      assignees: [projectMember._id],
    });

    await Comment.create({
      task: task._id,
      author: projectMember._id,
      text: "first comment",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("project member lists comments", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${task._id}/comments`)
      .set("Authorization", bearerFor(projectMember));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe("first comment");
  });

  test("workspace member outside the project gets 403", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${task._id}/comments`)
      .set("Authorization", bearerFor(workspaceMemberOnly));
    expect(res.status).toBe(403);
  });

  test("non-member gets 403", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${task._id}/comments`)
      .set("Authorization", bearerFor(outsider));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "You are not a member of this project" });
  });

  test("unknown task returns 404", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/${new mongoose.Types.ObjectId()}/comments`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(404);
  });
});
