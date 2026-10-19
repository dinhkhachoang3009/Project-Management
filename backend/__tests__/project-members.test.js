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

const createBody = (members) => ({
  title: "Validated Project",
  status: "Planning",
  startDate: "2026-01-01",
  dueDate: "2026-12-31",
  ...(members ? { members } : {}),
});

describe("project member validation (B3a)", () => {
  let stopTestDb;
  let owner;
  let wsMember;
  let outsider;
  let workspace;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("B3a Owner", "b3a-owner@test.local");
    wsMember = await createUser("B3a Member", "b3a-member@test.local");
    outsider = await createUser("B3a Outsider", "b3a-outsider@test.local");

    workspace = await Workspace.create({
      name: "B3a Workspace",
      owner: owner._id,
      members: [
        { user: owner._id, role: "owner" },
        { user: wsMember._id, role: "member" },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("create: unknown user id in members → 400 + project not created", async () => {
    const res = await request(app)
      .post(`/api-v1/projects/${workspace._id}/create-project`)
      .set("Authorization", bearerFor(owner))
      .send(
        createBody([
          { user: new mongoose.Types.ObjectId().toString(), role: "contributor" },
        ])
      );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "All project members must be members of this workspace",
    });
    expect(await Project.countDocuments({ workspace: workspace._id })).toBe(0);
  });

  test("create: registered user who is not a workspace member → 400", async () => {
    const res = await request(app)
      .post(`/api-v1/projects/${workspace._id}/create-project`)
      .set("Authorization", bearerFor(owner))
      .send(createBody([{ user: outsider._id.toString(), role: "manager" }]));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "All project members must be members of this workspace",
    });
    expect(await Project.countDocuments({ workspace: workspace._id })).toBe(0);
  });

  test("create: workspace members accepted → 201", async () => {
    const res = await request(app)
      .post(`/api-v1/projects/${workspace._id}/create-project`)
      .set("Authorization", bearerFor(owner))
      .send(
        createBody([
          { user: wsMember._id.toString(), role: "contributor" },
        ])
      );
    expect(res.status).toBe(201);
    // creator was NOT in the supplied list → auto-added as manager
    const mm = res.body.members.find((m) => m.user === owner._id.toString());
    expect(mm.role).toBe("manager");
  });

  test("create: creator already listed as contributor only → 400 (no manager)", async () => {
    const res = await request(app)
      .post(`/api-v1/projects/${workspace._id}/create-project`)
      .set("Authorization", bearerFor(owner))
      .send(
        createBody([
          { user: owner._id.toString(), role: "contributor" },
          { user: wsMember._id.toString(), role: "contributor" },
        ])
      );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "A project must have at least one manager",
    });
  });

  test("update: replacing members with only contributors → 400", async () => {
    const project = await Project.create({
      title: "B3a Updatable",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: owner._id, role: "manager" }],
    });

    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(owner))
      .send({
        members: [
          { user: owner._id.toString(), role: "contributor" },
          { user: wsMember._id.toString(), role: "contributor" },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "A project must have at least one manager",
    });

    const fresh = await Project.findById(project._id);
    expect(fresh.members).toHaveLength(1); // unchanged
  });

  test("update: cannot remove the last manager ( outsider swap ) → 400, members unchanged", async () => {
    const project = await Project.create({
      title: "B3a Manager",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [
        { user: owner._id, role: "manager" },
        { user: wsMember._id, role: "contributor" },
      ],
    });

    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(owner))
      .send({
        members: [
          { user: wsMember._id.toString(), role: "contributor" },
          { user: outsider._id.toString(), role: "manager" },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "All project members must be members of this workspace",
    });

    const fresh = await Project.findById(project._id);
    expect(fresh.members).toHaveLength(2); // unchanged
    const managerStill = fresh.members.find(
      (m) => m.user.toString() === owner._id.toString()
    );
    expect(managerStill.role).toBe("manager");
  });

  test("update: project whose workspace no longer exists → 404, not 500", async () => {
    // legacy orphan shape: pre-B2 deleteWorkspace left projects (and their
    // members) in the DB after the workspace doc was gone
    const orphan = await Project.create({
      title: "Orphan Project",
      workspace: new mongoose.Types.ObjectId(), // workspace doc does not exist
      createdBy: wsMember._id,
      members: [{ user: wsMember._id, role: "manager" }],
    });

    const res = await request(app)
      .put(`/api-v1/projects/${orphan._id}`)
      .set("Authorization", bearerFor(wsMember))
      .send({
        title: "Updated Orphan",
        members: [{ user: wsMember._id.toString(), role: "manager" }],
      });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Workspace not found" });
  });

  test("update: valid replacement with a manager → 200", async () => {
    const project = await Project.create({
      title: "B3a Swap",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [
        { user: owner._id, role: "manager" },
        { user: wsMember._id, role: "contributor" },
      ],
    });

    const res = await request(app)
      .put(`/api-v1/projects/${project._id}`)
      .set("Authorization", bearerFor(owner))
      .send({
        members: [
          { user: wsMember._id.toString(), role: "manager" },
          { user: owner._id.toString(), role: "contributor" },
        ],
      });
    expect(res.status).toBe(200);
    const mm = res.body.members.find((m) => m.user === wsMember._id.toString());
    expect(mm.role).toBe("manager");
  });
});
