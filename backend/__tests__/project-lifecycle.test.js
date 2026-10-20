import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
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

describe("project lifecycle control (D2: project manager OR workspace owner/admin)", () => {
  let stopTestDb;
  let owner;
  let admin;
  let manager;
  let contributor;
  let plainMember;
  let workspace;

  // fresh project per destructive/mutating test
  const makeProject = (title) =>
    Project.create({
      title,
      workspace: workspace._id,
      createdBy: manager._id,
      members: [
        { user: manager._id, role: "manager" },
        { user: contributor._id, role: "contributor" },
      ],
    });

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("D2 Owner", "d2-owner@test.local");
    admin = await createUser("D2 Admin", "d2-admin@test.local");
    manager = await createUser("D2 Manager", "d2-manager@test.local");
    contributor = await createUser("D2 Contributor", "d2-contrib@test.local");
    plainMember = await createUser("D2 Member", "d2-member@test.local");

    workspace = await Workspace.create({
      name: "D2 Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: admin._id, role: "admin" },
        { user: manager._id, role: "member" },
        { user: contributor._id, role: "member" },
        { user: plainMember._id, role: "member" },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("workspace owner (not a project member) can update the project", async () => {
    const project = await makeProject("D2 Owner Edit");
    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(owner))
      .send({ title: "Renamed by Owner" });
    expect(res.status).toBe(200);
    const fresh = await Project.findById(project._id);
    expect(fresh.title).toBe("Renamed by Owner");
  });

  test("workspace admin (not a project member) can update the project", async () => {
    const project = await makeProject("D2 Admin Edit");
    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(admin))
      .send({ title: "Renamed by Admin" });
    expect(res.status).toBe(200);
    const fresh = await Project.findById(project._id);
    expect(fresh.title).toBe("Renamed by Admin");
  });

  test("project manager can still update the project (status quo)", async () => {
    const project = await makeProject("D2 Manager Edit");
    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(manager))
      .send({ title: "Renamed by Manager" });
    expect(res.status).toBe(200);
  });

  test("project contributor is still denied", async () => {
    const project = await makeProject("D2 Contrib Edit");
    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(contributor))
      .send({ title: "Nope" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "Only a project manager or workspace owner/admin can update this project",
    });
  });

  test("plain workspace member (not a project member) is denied", async () => {
    const project = await makeProject("D2 Member Edit");
    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(plainMember))
      .send({ title: "Nope" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "Only a project manager or workspace owner/admin can update this project",
    });
  });

  test("workspace owner (not a project member) can delete the project", async () => {
    const project = await makeProject("D2 Owner Delete");
    const res = await request(app)
      .delete(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(owner));
    expect(res.status).toBe(200);
    expect(await Project.countDocuments({ _id: project._id })).toBe(0);
  });

  test("plain workspace member cannot delete the project", async () => {
    const project = await makeProject("D2 Member Delete");
    const res = await request(app)
      .delete(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(plainMember));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "Only a project manager or workspace owner/admin can delete this project",
    });
    expect(await Project.countDocuments({ _id: project._id })).toBe(1);
  });
});
