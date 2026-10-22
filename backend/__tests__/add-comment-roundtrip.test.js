process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

jest.unstable_mockModule("../libs/arcjet.js", () => ({
  __esModule: true,
  default: { protect: async () => ({ isDenied: () => false }) },
}));

const { default: createApp } = await import("../app.js");
const { default: request } = await import("supertest");
const mongoose = await import("mongoose");
const bcrypt = await import("bcrypt");
const { startTestDb } = await import("./helpers/test-env.js");
const { default: User } = await import("../models/user.js");
const { default: Project } = await import("../models/project.js");
const { default: Task } = await import("../models/task.js");

const app = createApp();

describe("addComment single round-trip (G11)", () => {
  let stopTestDb;
  let member;
  let token;
  let projectId;
  let taskId;
  let findByIdCallCount = 0;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    member = await User.create({
      name: "Comment Member",
      email: "g11-member@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
      profilePicture: "data:image/svg+xml;utf8,z",
    });
    const owner = await User.create({
      name: "Project Owner",
      email: "g11-owner@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });

    const jwt = await import("jsonwebtoken");
    const { TEST_JWT_SECRET } = await import("./helpers/test-env.js");
    token = jwt.default.sign({ userId: member._id }, TEST_JWT_SECRET, {
      expiresIn: "1d",
    });

    const project = await Project.create({
      title: "G11 Project",
      description: "",
      status: "Planning",
      startDate: new Date(),
      dueDate: new Date(),
      createdBy: owner._id,
      workspace: new mongoose.Types.ObjectId(),
      members: [{ user: member._id, role: "manager" }],
      tags: [],
    });
    projectId = project._id.toString();
    const task = await Task.create({
      title: "G11 Task",
      priority: "Medium",
      project: project._id,
      assignees: [member._id],
      createdBy: owner._id,
    });
    taskId = task._id.toString();

    // count REAL Comment.findById executions by wrapping the static
    const { default: Comment } = await import("../models/comment.js");
    const originalCommentFindById = Comment.findById;
    Comment.findById = (...args) => {
      findByIdCallCount += 1;
      return originalCommentFindById.apply(Comment, args);
    };
    global.__restoreCommentFindById = () => {
      Comment.findById = originalCommentFindById;
    };
  });

  afterAll(async () => {
    if (global.__restoreCommentFindById) global.__restoreCommentFindById();
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("201 answer carries the author inline — no re-find", async () => {
    findByIdCallCount = 0;

    const res = await request(app)
      .post(`/api-v1/tasks/${taskId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "One round trip comment" });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("One round trip comment");
    expect(String(res.body.author._id)).toBe(String(member._id));
    expect(res.body.author.name).toBe("Comment Member");
    expect(res.body.author.profilePicture).toBe("data:image/svg+xml;utf8,z");

    expect(findByIdCallCount).toBe(0);
  });
});
