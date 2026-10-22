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

// Permission matrix (H2e): workspace role x project role against the
// project/task/comment/assignment actions, pinning the CURRENT contracts:
// - resolveTaskMember (comments/activity) = project-membership only
// - checkTaskPermission (task mutations incl. assignees) = project role
// - project PUT/DELETE = project manager OR workspace owner/admin (D2)
// If a cell disagrees with the code, STOP and ledger it — never loosen
// the test to make it pass.

// combos: [label, wsRole|null, projectRole|null]
const COMBOS = [
  ["outsider", null, null],
  ["ws owner, project outsider", "owner", null],
  ["ws admin, project outsider", "admin", null],
  ["ws member, project outsider", "member", null],
  ["ws viewer, project outsider", "viewer", null],
  ["ws member + project manager", "member", "manager"],
  ["ws member + project contributor", "member", "contributor"],
  ["ws member + project viewer", "member", "viewer"],
];

const expectFor = (wsRole, projectRole) => {
  const inProject = projectRole !== null;
  const wsLeader = wsRole === "owner" || wsRole === "admin";

  const manage =
    (inProject && projectRole === "manager") || wsLeader ? 200 : 403;

  return {
    board: inProject ? 200 : 403,
    createTask: inProject && projectRole !== "viewer" ? 201 : 403,
    updateProject: manage,
    deleteProject: manage,
    getComments: inProject ? 200 : 403,
    postComment: inProject ? 201 : 403,
    assignees:
      inProject && ["manager", "contributor"].includes(projectRole) ? 200 : 403,
  };
};

const createUser = (name, email) =>
  User.create({
    name,
    email,
    password: "$2a$10$abcdefghijklmnopqrstuvC6UzMDM.HagdfAcvvC8nL",
    isEmailVerified: true,
  });
const tok = (id) => jwt.default.sign({ userId: id }, TEST_JWT_SECRET);

describe("permission matrix (H2e)", () => {
  let stopTestDb;
  let wsId;
  let projectId;
  let taskId;
  const tokens = new Map(); // label → token
  const ids = new Map(); // label → _id

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    const owner = await createUser("Matrix Owner", "mat-owner@test.local");
    const ws = await Workspace.create({
      name: "Matrix WS",
      color: "#FF5733",
      owner: owner._id,
      members: [{ user: owner._id, role: "owner" }],
    });
    wsId = ws._id.toString();

    const project = await Project.create({
      title: "Matrix Project",
      description: "",
      status: "Planning",
      startDate: new Date(),
      dueDate: new Date(),
      createdBy: owner._id,
      workspace: wsId,
      members: [{ user: owner._id, role: "manager" }],
      tags: [],
    });
    projectId = project._id.toString();

    const task = await Task.create({
      title: "Matrix Task",
      priority: "High",
      project: projectId,
      assignees: [owner._id],
      createdBy: owner._id,
    });
    taskId = task._id.toString();

    tokens.set("ws owner + project viewer", tok(owner._id));
    ids.set("ws owner + project viewer", owner._id);

    for (const label of [
      "outsider",
      "ws owner, project outsider",
      "ws admin, project outsider",
      "ws member, project outsider",
      "ws viewer, project outsider",
      "ws member + project manager",
      "ws member + project contributor",
      "ws member + project viewer",
    ]) {
      const slug = label.replace(/[^a-z]+/gi, "-");
      const u = await createUser(`M ${slug}`, `mat-${slug}@test.local`);
      tokens.set(label, tok(u._id));
      ids.set(label, u._id);

      // ws roles
      if (label.includes("ws admin")) {
        await Workspace.findByIdAndUpdate(wsId, {
          $push: { members: { user: u._id, role: "admin" } },
        });
      } else if (label.includes("ws member")) {
        await Workspace.findByIdAndUpdate(wsId, {
          $push: { members: { user: u._id, role: "member" } },
        });
      } else if (label.includes("ws viewer")) {
        await Workspace.findByIdAndUpdate(wsId, {
          $push: { members: { user: u._id, role: "viewer" } },
        });
      } else if (label.includes("ws owner")) {
        await Workspace.findByIdAndUpdate(wsId, {
          $push: { members: { user: u._id, role: "owner" } },
        });
      }

      // project roles
      if (!label.includes("outsider")) {
        const role = label.split("project ")[1];
        await Project.findByIdAndUpdate(projectId, {
          $push: { members: { user: u._id, role } },
        });
      }
    }

    // ws owner + project viewer: demote the owner INSIDE the project
    await Project.findOneAndUpdate(
      { _id: projectId, "members.user": owner._id },
      { $set: { "members.$.role": "viewer" } }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  const runAction = async (action, token, actorId) => {
    switch (action) {
      case "board":
        return agent
          .get(`/api-v1/tasks/project/${projectId}`)
          .set("Authorization", `Bearer ${token}`);
      case "createTask":
        return agent
          .post(`/api-v1/tasks/${projectId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ title: "Matrix new task" });
      case "updateProject":
        return agent
          .put(`/api-v1/projects/${projectId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ title: "Matrix Project", description: "upd" });
      case "deleteProject":
        return agent
          .delete(`/api-v1/projects/${projectId}`)
          .set("Authorization", `Bearer ${token}`);
      case "getComments":
        return agent
          .get(`/api-v1/tasks/${taskId}/comments`)
          .set("Authorization", `Bearer ${token}`);
      case "postComment":
        return agent
          .post(`/api-v1/tasks/${taskId}/comments`)
          .set("Authorization", `Bearer ${token}`)
          .send({ text: "matrix comment" });
      case "assignees":
        return agent
          .put(`/api-v1/tasks/${taskId}/assignees`)
          .set("Authorization", `Bearer ${token}`)
          .send({ assignees: [actorId] });
      default:
        throw new Error(`unknown action ${action}`);
    }
  };

  test("every ws-role x project-role combination answers the pinned status", async () => {
    for (const [label, wsRole] of COMBOS) {
      const projectRole = label.includes("project ")
        ? label.split("project ")[1]
        : null;
      const roleOrNull = projectRole === "outsider" ? null : projectRole;
      const expected = expectFor(wsRole, roleOrNull);
      const token = tokens.get(label);

      // destructive 200-cells are asserted via PUT (same gate); the matrix
      // runs the DELETE request only for the 403 cells
      for (const action of Object.keys(expected)) {
        if (action === "deleteProject" && expected[action] === 200) continue;

        const res = await runAction(action, token, ids.get(label));
        const failures = [];
        if (res.status !== expected[action]) {
          failures.push(`${label} / ${action}: got ${res.status}, want ${expected[action]}`);
        }
        expect(failures).toEqual([]);
      }
    }
  });
});
