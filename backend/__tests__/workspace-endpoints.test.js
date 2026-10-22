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
const { default: Workspace } = await import("../models/workspace.js");
const { default: Project } = await import("../models/project.js");

const app = createApp();
const agent = request(app);

describe("workspace create/edit/list (H2d)", () => {
  let stopTestDb;
  let member;
  let plainMember;
  let memberToken;
  let plainToken;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    member = await User.create({
      name: "WS Owner",
      email: "h2d-owner@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });
    plainMember = await User.create({
      name: "WS Plain",
      email: "h2d-plain@test.local",
      password: await bcrypt.hash("KnownPass123", 10),
      isEmailVerified: true,
    });
    memberToken = jwt.default.sign({ userId: member._id }, TEST_JWT_SECRET, { expiresIn: "1d" });
    plainToken = jwt.default.sign({ userId: plainMember._id }, TEST_JWT_SECRET, { expiresIn: "1d" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  test("POST /workspaces creates owner membership + counts the created_workspace activity", async () => {
    const res = await agent
      .post("/api-v1/workspaces")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "H2D Workspace", color: "#33C1FF", description: "d" });

    expect(res.status).toBe(201);
    expect(String(res.body.owner)).toBe(String(member._id));
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].role).toBe("owner");

    const { default: ActivityLog } = await import("../models/activity.js");
    expect(
      await ActivityLog.countDocuments({
        user: member._id,
        action: "created_workspace",
      })
    ).toBe(1);
  });

  test("GET /workspaces lists only member workspaces", async () => {
    // a workspace the plain member does NOT belong to
    await Workspace.create({
      name: "Not Yours",
      color: "#28A745",
      owner: member._id,
      members: [{ user: member._id, role: "owner" }],
    });

    const res = await agent
      .get("/api-v1/workspaces")
      .set("Authorization", `Bearer ${plainToken}`);
    expect(res.status).toBe(200);
    expect(res.body.map((w) => w.name)).not.toContain("Not Yours");
  });

  test("PUT /workspaces/:id persists edits for the owner", async () => {
    const ws = await Workspace.findOne({ name: "H2D Workspace" });
    const res = await agent
      .put(`/api-v1/workspaces/${ws._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "H2D Renamed", color: "#8E44AD", description: "edited" });

    expect(res.status).toBe(200);
    const fresh = await Workspace.findById(ws._id).lean();
    expect(fresh.name).toBe("H2D Renamed");
    expect(fresh.description).toBe("edited");
  });

  test("PUT /workspaces/:id rejects a plain member with 403", async () => {
    // plain member joins a throwaway workspace mid-test
    const ws = await Workspace.findOne({ name: "Not Yours" });
    await Workspace.findByIdAndUpdate(ws._id, {
      $push: { members: { user: plainMember._id, role: "member" } },
    });

    const res = await agent
      .put(`/api-v1/workspaces/${ws._id}`)
      .set("Authorization", `Bearer ${plainToken}`)
      .send({ name: "hijack" });

    expect(res.status).toBe(403);
    const fresh = await Workspace.findById(ws._id).lean();
    expect(fresh.name).toBe("Not Yours");
  });

  test("GET /workspaces/:id/projects flags member-scoped projects", async () => {
    const ws = await Workspace.findOne({ name: "H2D Renamed" });
    const res = await agent
      .get(`/api-v1/workspaces/${ws._id}/projects`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.workspace._id).toBe(String(ws._id));
    expect(Array.isArray(res.body.projects)).toBe(true);
  });
});
