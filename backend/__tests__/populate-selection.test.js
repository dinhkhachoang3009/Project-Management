import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import { startTestDb } from "./helpers/test-env.js";

const app = createApp();

describe("getProjectTasks member populate selection (G2)", () => {
  let stopTestDb;
  let owner;
  let token;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await User.create({
      name: "Owner User",
      email: "g2-owner@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
      isEmailVerified: true,
      lastLogin: new Date(),
      profilePicture: "data:image/svg+xml;utf8,x",
    });
    const member = await User.create({
      name: "Leaky Member",
      email: "g2-member@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
      isEmailVerified: true,
      lastLogin: new Date(),
      profilePicture: "data:image/svg+xml;utf8,y",
    });

    // login to get a token (password hash constant is not a real bcrypt of it;
    // sign a session token directly through the app contract instead)
    const jwt = await import("jsonwebtoken");
    const { TEST_JWT_SECRET } = await import("./helpers/test-env.js");
    token = jwt.default.sign({ userId: member._id }, TEST_JWT_SECRET, {
      expiresIn: "1d",
    });

    const project = await Project.create({
      title: "G2 Project",
      description: "",
      status: "Planning",
      startDate: new Date(),
      dueDate: new Date(),
      createdBy: owner._id,
      workspace: new mongoose.Types.ObjectId(),
      members: [
        { user: owner._id, role: "manager" },
        { user: member._id, role: "contributor" },
      ],
      tags: [],
    });
    const task = await Task.create({
      title: "G2 Task",
      priority: "High",
      project: project._id,
      assignees: [member._id],
      createdBy: owner._id,
    });
    await Project.findByIdAndUpdate(project._id, { $push: { tasks: task._id } });
    global.__g2projectId = project._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("member subdocs expose only identity fields — no lastLogin, no password", async () => {
    const res = await request(app)
      .get(`/api-v1/tasks/project/${global.__g2projectId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const members = res.body.project.members;
    expect(members).toHaveLength(2);
    for (const m of members) {
      expect(m.user.name).toBeTruthy();
      expect(m.user._id).toBeTruthy();
      expect(m.user.profilePicture).toBeTruthy();
      expect(m.user).not.toHaveProperty("lastLogin");
      expect(m.user).not.toHaveProperty("password");
      expect(m.user).not.toHaveProperty("email", undefined);
    }
  });
});
