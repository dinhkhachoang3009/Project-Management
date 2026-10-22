process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: async () => ({ isDenied: () => false }) },
}));

const { default: createApp } = await import("../app.js");
const { default: request } = await import("supertest");
const mongoose = await import("mongoose");
const jwt = await import("jsonwebtoken");
const { startTestDb, TEST_JWT_SECRET } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");
const { default: Workspace } = await import("../models/workspace.js");
const { default: Project } = await import("../models/project.js");
const { default: Task } = await import("../models/task.js");

const app = createApp();
const agent = request(app);

describe("getMyTasks / achieved backend contract (H2f / B1)", () => {
  let stopTestDb;
  let userToken;
  let userId;
  let wsId;
  let projectId;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    const user = await User.create({
      name: "Achieved User",
      email: "h2f@test.local",
      password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
      isEmailVerified: true,
    });
    userId = user._id;
    userToken = jwt.default.sign({ userId }, TEST_JWT_SECRET, { expiresIn: "1d" });

    const ws = await Workspace.create({
      name: "H2F WS",
      color: "#28A745",
      owner: user._id,
      members: [{ user, role: "owner" }],
    });
    wsId = ws._id.toString();

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const project = await Project.create({
      title: "H2F Project",
      description: "d",
      status: "Planning",
      startDate: fiveMinAgo,
      dueDate: new Date(),
      createdBy: user._id,
      workspace: wsId,
      members: [{ user: user._id, role: "manager" }],
      tags: [],
    });
    projectId = project._id.toString();

    await Task.create({
      title: "Active Task",
      priority: "Medium",
      project: projectId,
      assignees: [userId],
      createdBy: user._id,
    });
    await Task.create({
      title: "Archived Task",
      priority: "Low",
      project: projectId,
      assignees: [userId],
      createdBy: user._id,
      isArchived: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("B1 contract: archived tasks come back alongside active ones", async () => {
    const res = await agent
      .get("/api-v1/tasks/my-tasks")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const names = res.body.map((t) => ({ name: t.title }));
    expect(names.find((n) => n.name === "Archived Task")).toBeTruthy();
    expect(names.find((n) => n.name === "Active Task")).toBeTruthy();

    const archived = res.body.find((t) => t.title === "Archived Task");
    expect(archived.isArchived).toBe(true);
    const active = res.body.find((t) => t.title === "Active Task");
    expect(active.isArchived).toBe(false);
  });

  test("project populate carries _id + title + workspace (buildTaskDetailUrl needs all three)", async () => {
    const res = await agent
      .get("/api-v1/tasks/my-tasks")
      .set("Authorization", `Bearer ${userToken}`);

    for (const t of res.body) {
      expect(t.project._id).toBe(projectId);
      expect(t.project.title).toBe("H2F Project");
      expect(t.project.workspace).toBe(wsId);
    }
  });
});
