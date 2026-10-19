import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import createApp from "../app.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
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

describe("GET /workspaces/:id/stats — archived discipline (D3, locked contract)", () => {
  let stopTestDb;
  let owner;
  let workspace;
  let projectA; // active project
  let projectB; // active
  let archivedProject;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);

    owner = await createUser("Stats Owner", "stats-owner@test.local");
    workspace = await Workspace.create({
      name: "Stats Workspace",
      owner: owner._id,
      members: [{ user: owner._id, role: "owner" }],
    });

    projectA = await Project.create({
      title: "Project A",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: owner._id, role: "manager" }],
    });
    projectB = await Project.create({
      title: "Project B",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: owner._id, role: "manager" }],
    });
    archivedProject = await Project.create({
      title: "Project Archived",
      workspace: workspace._id,
      createdBy: owner._id,
      members: [{ user: owner._id, role: "manager" }],
      isArchived: true,
    });

    // projectA: active Done, archived Done, active To Do, archived To Do
    await Task.create({ title: "A-Done", project: projectA._id, createdBy: owner._id, status: "Done" });
    await Task.create({ title: "A-Done-Arc", project: projectA._id, createdBy: owner._id, status: "Done", isArchived: true });
    await Task.create({ title: "A-Todo", project: projectA._id, createdBy: owner._id });
    await Task.create({ title: "A-Todo-Arc", project: projectA._id, createdBy: owner._id, isArchived: true });
    // projectB: one active To Do
    await Task.create({ title: "B-Todo", project: projectB._id, createdBy: owner._id });

    // D1 window cases (upcoming = dueDate in (now, now+7d])
    await Task.create({ title: "Upcoming Todo", project: projectA._id, createdBy: owner._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
    await Task.create({ title: "Upcoming Done", project: projectA._id, createdBy: owner._id, status: "Done", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
    await Task.create({ title: "Upcoming Archived", project: projectA._id, createdBy: owner._id, isArchived: true, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
    await Task.create({ title: "Far Future", project: projectA._id, createdBy: owner._id, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    await Task.create({ title: "Past Due", project: projectA._id, createdBy: owner._id, dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) });
    await Task.create({ title: "No DueDate", project: projectA._id, createdBy: owner._id });

    // D4 trend cases (bucketed by createdAt, UTC day math)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    threeDaysAgo.setUTCHours(12, 0, 0, 0); // fixed UTC clock time of that day
    await Task.create({
      title: "Trend Created 3d",
      project: projectA._id,
      createdBy: owner._id,
      createdAt: threeDaysAgo, // mongoose honors an explicit createdAt
    });
    await Task.create({
      title: "Trend Created 10d",
      project: projectA._id,
      createdBy: owner._id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // Task.create does not register into project.tasks (that's the API's
    // $push) — the stats path reads the populated projects.tasks arrays, so
    // link every task the way the API would
    for (const t of await Task.find({})) {
      await Project.findByIdAndUpdate(t.project, {
        $push: { tasks: t._id },
      });
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  const getStats = async () =>
    request(app)
      .get(`/api-v1/workspaces/${workspace._id}/stats`)
      .set("Authorization", bearerFor(owner));

  test("totalProjects excludes archived projects", async () => {
    expect((await getStats()).body.stats.totalProjects).toBe(2);
  });

  test("totalTasks excludes archived tasks", async () => {
    expect((await getStats()).body.stats.totalTasks).toBe(10); // 13 seeded tasks, 3 archived excluded
  });

  test("status totals exclude archived tasks (2 done, 8 todo, 0 in progress)", async () => {
    const stats = (await getStats()).body.stats;
    expect(stats.totalTaskCompleted).toBe(2);
    expect(stats.totalTaskToDo).toBe(8);
    expect(stats.totalTaskInProgress).toBe(0);
  });

  test("productivity totals match the same exclusion", async () => {
    const res = await getStats();
    const prodA = res.body.workspaceProductivityData.find((p) => p.name === "Project A");
    expect(prodA).toEqual({ name: "Project A", completed: 2, total: 9 });
  });

  test("recentProjects excludes archived projects", async () => {
    const res = await getStats();
    expect(res.body.recentProjects.map((p) => p.title)).not.toContain("Project Archived");
  });

  test("upcoming includes a To Do task due within 7 days", async () => {
    const res = await getStats();
    expect(res.body.upcomingTasks.map((t) => t.title)).toContain("Upcoming Todo");
  });

  test("upcoming excludes Done tasks even with a future dueDate", async () => {
    const res = await getStats();
    expect(res.body.upcomingTasks.map((t) => t.title)).not.toContain("Upcoming Done");
  });

  test("upcoming excludes archived tasks", async () => {
    const res = await getStats();
    expect(res.body.upcomingTasks.map((t) => t.title)).not.toContain("Upcoming Archived");
  });

  test("upcoming excludes tasks due beyond 7 days or in the past", async () => {
    const res = await getStats();
    const titles = res.body.upcomingTasks.map((t) => t.title);
    expect(titles).not.toContain("Far Future");
    expect(titles).not.toContain("Past Due");
    expect(titles).not.toContain("No DueDate");
  });

  test("projectStatusData pie includes all 5 statuses (D2)", async () => {
    // self-contained so the D3 totals assertions above stay untouched
    const pieWs = await Workspace.create({
      name: "Pie Workspace",
      owner: owner._id,
      members: [{ user: owner._id, role: "owner" }],
    });
    const statuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
    for (const status of statuses) {
      const p = await Project.create({
        title: `Pie ${status}`,
        workspace: pieWs._id,
        createdBy: owner._id,
        members: [{ user: owner._id, role: "manager" }],
        status,
      });
      const t = await Task.create({ title: `Pie T ${status}`, project: p._id, createdBy: owner._id });
      await Project.findByIdAndUpdate(p._id, { $push: { tasks: t._id } });
    }

    const res = await request(app)
      .get(`/api-v1/workspaces/${pieWs._id}/stats`)
      .set("Authorization", bearerFor(owner));
    const pie = res.body.projectStatusData;
    for (const status of statuses) {
      const slice = pie.find((s) => s.name === status);
      expect(slice).toBeDefined();
      expect(slice.value).toBe(1);
      expect(slice.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test("taskTrends buckets by createdAt, not updatedAt (D4)", async () => {
    const res = await getStats();
    const trends = res.body.taskTrendsData;

    // expected weekday names, computed with the SAME UTC math the endpoint
    // should be using
    const weekdayFor = (daysAgo) =>
      new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

    // total counted tasks: 8 created now + 1 created 3d ago = 9
    // (non-archived; Trend Created 10d excluded by the 7-day window)
    const totalAllBuckets = trends.reduce(
      (a, d) => a + d.completed + d.inProgress + d.todo,
      0
    );
    expect(totalAllBuckets).toBe(9); // 8 created now + 1 created 3d ago
    const buckets3d = trends.find((d) => d.name === weekdayFor(3));
    expect(buckets3d).toEqual({
      name: weekdayFor(3),
      completed: 0,
      inProgress: 0,
      todo: 1,
    });
    const todayBucket = trends.find((d) => d.name === weekdayFor(0));
    expect(todayBucket).toEqual({
      name: weekdayFor(0),
      completed: 2, // A-Done + Upcoming Done
      inProgress: 0,
      todo: 6, // the 8 created-now tasks − 2 completed
    });
    // each weekday bucket name appears once (7 distinct UTC weekdays)
    expect(new Set(trends.map((d) => d.name)).size).toBe(7);
  });
});
