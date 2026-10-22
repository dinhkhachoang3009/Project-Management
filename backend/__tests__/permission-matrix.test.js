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

// combos: [label, wsRole|null, projectRole|null] — full grid:
// 4 ws roles x 3 project roles + 4 ws-only + 1 outsider
const COMBOS = [
  ["outsider", null, null],
  ["ws owner only", "owner", null],
  ["ws admin only", "admin", null],
  ["ws member only", "member", null],
  ["ws viewer only", "viewer", null],
  ["ws owner + project manager", "owner", "manager"],
  ["ws owner + project contributor", "owner", "contributor"],
  ["ws owner + project viewer", "owner", "viewer"],
  ["ws admin + project manager", "admin", "manager"],
  ["ws admin + project contributor", "admin", "contributor"],
  ["ws admin + project viewer", "admin", "viewer"],
  ["ws member + project manager", "member", "manager"],
  ["ws member + project contributor", "member", "contributor"],
  ["ws member + project viewer", "member", "viewer"],
  ["ws viewer + project manager", "viewer", "manager"],
  ["ws viewer + project contributor", "viewer", "contributor"],
  ["ws viewer + project viewer", "viewer", "viewer"],
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

    const wsRoles = { owner: "owner", admin: "admin", member: "member", viewer: "viewer" };

    for (const label of [
      "outsider",
      "ws owner only",
      "ws admin only",
      "ws member only",
      "ws viewer only",
      "ws owner + project manager",
      "ws owner + project contributor",
      "ws owner + project viewer",
      "ws admin + project manager",
      "ws admin + project contributor",
      "ws admin + project viewer",
      "ws member + project manager",
      "ws member + project contributor",
      "ws member + project viewer",
      "ws viewer + project manager",
      "ws viewer + project contributor",
      "ws viewer + project viewer",
    ]) {
      const slug = label.replace(/[^a-z]+/gi, "-");
      const u = await createUser(`M ${slug}`, `mat-${slug}@test.local`);
      tokens.set(label, tok(u._id));
      ids.set(label, u._id);

      // ws role (from "ws <role>")
      const wsRole = label.match(/ws (owner|admin|member|viewer)/)?.[1];
      if (wsRole) {
        await Workspace.findByIdAndUpdate(wsId, {
          $push: { members: { user: u._id, role: wsRoles[wsRole] } },
        });
      }

      // project role (from "project <role>")
      const projectRole = label.match(/project (manager|contributor|viewer)/)?.[1];
      if (projectRole) {
        await Project.findByIdAndUpdate(projectId, {
          $push: { members: { user: u._id, role: projectRole } },
        });
      }
    }
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
      const projectRole = label.match(/project (manager|contributor|viewer)/)?.[1] || null;
      const expected = expectFor(wsRole, projectRole);
      const token = tokens.get(label);

      // destructive 200-cells are asserted via PUT (same gate); the matrix
      // runs the DELETE request only for the 403 cells
      for (const action of Object.keys(expected)) {
        // DELETE 200-cells: covered by cascade-deletes.test.js and
      // project-lifecycle.test.js (same D2 gate as PUT, asserted above) —
      // skipped here to preserve the shared project fixture.
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
