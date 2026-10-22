process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: async () => ({ isDenied: () => false }) },
}));

const { default: createApp } = await import("../app.js");
const { default: request } = await import("supertest");
const mongoose = await import("mongoose");
const bcrypt = await import("bcrypt");
const jwt = await import("jsonwebtoken");
const { startTestDb, TEST_JWT_SECRET } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");
const { default: Project } = await import("../models/project.js");
const { default: Task } = await import("../models/task.js");

const app = createApp();
const agent = request(app);

describe("task detail endpoints (H2c)", () => {
  let stopTestDb;
  let member;
  let nonMember;
  let memberToken;
  let nonMemberToken;
  let wsId;
  let projectId;
  let taskId;

  const seed = async (user) => Task.create({
    title: "Seed Task",
    priority: "High",
    status: "To Do",
    project: projectId,
    assignees: [user._id],
    createdBy: user._id,
  });

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    member = await User.create({
      name: "Task Member",
      email: "h2c-member@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });
    nonMember = await User.create({
      name: "Task Outsider",
      email: "h2c-outsider@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });

    memberToken = jwt.default.sign({ userId: member._id }, TEST_JWT_SECRET, { expiresIn: "1d" });
    nonMemberToken = jwt.default.sign({ userId: nonMember._id }, TEST_JWT_SECRET, { expiresIn: "1d" });

    const workspace = await (await import("../models/workspace.js")).default.create({
      name: "H2C WS",
      color: "#FF5733",
      owner: member._id,
      members: [{ user: member._id, role: "owner" }],
    });
    wsId = workspace._id.toString();

    const project = await Project.create({
      title: "H2C Project",
      description: "",
      status: "Planning",
      startDate: new Date(),
      dueDate: new Date(),
      createdBy: member._id,
      workspace: wsId,
      members: [{ user: member._id, role: "manager" }],
      tags: [],
    });
    projectId = project._id;
    taskId = (await seed(member))._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("non-member GET /tasks/:id → 403 with the member message", async () => {
    const res = await agent
      .get(`/api-v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${nonMemberToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not a member/i);
  });

  test("member GET /tasks/:id → task + watchers empty + project populated", async () => {
    const res = await agent
      .get(`/api-v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task._id).toBe(taskId);
    expect(res.body.task.watchers).toHaveLength(0);
    expect(res.body.project.title).toBe("H2C Project");
  });

  test("PUT /tasks/:id/status persists", async () => {
    const res = await agent
      .put(`/api-v1/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "In Progress" });
    expect(res.status).toBe(200);

    const fresh = await Task.findById(taskId).lean();
    expect(fresh.status).toBe("In Progress");
  });

  test("PUT /tasks/:id/priority persists", async () => {
    const res = await agent
      .put(`/api-v1/tasks/${taskId}/priority`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ priority: "Low" });
    expect(res.status).toBe(200);

    const fresh = await Task.findById(taskId).lean();
    expect(fresh.priority).toBe("Low");
  });

  test("watch toggle: add then remove", async () => {
    const watch = await agent
      .post(`/api-v1/tasks/${taskId}/watch`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(watch.status).toBe(200);

    let fresh = await Task.findById(taskId).lean();
    expect(fresh.watchers.map(String)).toContain(String(member._id));

    const unwatch = await agent
      .post(`/api-v1/tasks/${taskId}/watch`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(unwatch.status).toBe(200);

    fresh = await Task.findById(taskId).lean();
    expect(fresh.watchers.map(String)).not.toContain(String(member._id));
  });

  test("archive then unarchive flips isArchived", async () => {
    const a = await agent
      .post(`/api-v1/tasks/${taskId}/archive`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(a.status).toBe(200);

    let fresh = await Task.findById(taskId).lean();
    expect(fresh.isArchived).toBe(true);

    const ua = await agent
      .post(`/api-v1/tasks/${taskId}/archive`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(ua.status).toBe(200);

    fresh = await Task.findById(taskId).lean();
    expect(fresh.isArchived).toBe(false);
  });

  test("subtask add + completion toggle rounds to the count", async () => {
    const add = await agent
      .post(`/api-v1/tasks/${taskId}/add-subtask`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Check the wiring" });
    expect(add.status).toBe(201);

    let fresh = await Task.findById(taskId).lean();
    const sub = fresh.subtasks.at(-1);
    expect(sub.title).toBe("Check the wiring");
    expect(sub.completed).toBe(false);

    const flip = await agent
      .put(`/api-v1/tasks/${taskId}/update-subtask/${sub._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ completed: true });
    expect(flip.status).toBe(200);

    fresh = await Task.findById(taskId).lean();
    expect(
      fresh.subtasks.filter((s) => String(s._id) === String(sub._id))[0].completed
    ).toBe(true);
  });
});
