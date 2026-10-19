import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import Comment from "../models/comment.js";
import ActivityLog from "../models/activity.js";
import User from "../models/user.js";
import { recordActivity } from "../libs/index.js";

// B3a: every supplied member must be an existing user AND a workspace
// member, and the final list must keep at least one manager (the creator is
// auto-added as manager before this runs on create).
const validateProjectMembers = async (projectMembers, workspaceId) => {
  const userIds = [
    ...new Set(projectMembers.map((m) => m.user.toString())),
  ].filter(Boolean);

  const existing = await User.find({ _id: { $in: userIds } }, "_id");
  const existingIds = new Set(existing.map((u) => u._id.toString()));

  const workspace = await Workspace.findById(workspaceId, "members");
  if (!workspace) {
    return { error: "Workspace not found", status: 404 };
  }
  const memberIds = new Set(
    workspace.members.map((m) => m.user.toString())
  );

  for (const id of userIds) {
    if (!existingIds.has(id) || !memberIds.has(id)) {
      return {
        error: "All project members must be members of this workspace",
        status: 400,
      };
    }
  }

  const hasManager = projectMembers.some((m) => m.role === "manager");
  if (!hasManager) {
    return { error: "A project must have at least one manager", status: 400 };
  }

  return { error: null };
};

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } =
      req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const userWorkspaceRole = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    )?.role;

    if (!userWorkspaceRole) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    if (userWorkspaceRole === "viewer") {
      return res.status(403).json({
        message: "Viewers cannot create projects",
      });
    }

    const tagArray = tags ? tags.split(",") : [];

    let projectMembers = members || [];
    const currentUserId = req.user._id.toString();
    const isCurrentUserInMembers = projectMembers.some(
      (m) =>
        m.user === currentUserId ||
        (m.user && m.user.toString() === currentUserId)
    );
    if (!isCurrentUserInMembers) {
      projectMembers.push({ user: req.user._id, role: "manager" });
    }

    const { error: memberError, status: memberStatus } =
      await validateProjectMembers(projectMembers, workspaceId);
    if (memberError) {
      return res.status(memberStatus).json({ message: memberError });
    }

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members: projectMembers,
      createdBy: req.user._id,
    });

    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { projects: newProject._id },
    });

    recordActivity(
      req.user._id,
      "created_project",
      "Project",
      newProject._id,
      { title, workspaceId }
    );

    return res.status(201).json(newProject);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userProjectRole = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    )?.role;

    if (!userProjectRole) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    if (userProjectRole !== "manager") {
      return res.status(403).json({
        message: "Only project managers can update project details",
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags ? tags.split(",") : [];
    if (members !== undefined) {
      const { error: memberError, status: memberStatus } =
        await validateProjectMembers(members, project.workspace);
      if (memberError) {
        return res.status(memberStatus).json({ message: memberError });
      }
      project.members = members;
    }

    await project.save();

    recordActivity(
      req.user._id,
      "updated_project",
      "Project",
      project._id,
      { title }
    );

    res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMember || userMember.role !== "manager") {
      return res.status(403).json({
        message: "Only project manager can delete this project",
      });
    }

    // B2 cascade: children first, parent last. No transaction (standalone
    // test mongod + low-frequency admin op) — children-first keeps the state
    // re-runnable on failure.
    const taskIds = await Task.find({ project: projectId }).distinct("_id");
    const commentIds = taskIds.length
      ? await Comment.find({ task: { $in: taskIds } }).distinct("_id")
      : [];

    await Task.deleteMany({ project: projectId });
    if (commentIds.length) {
      await Comment.deleteMany({ task: { $in: taskIds } });
    }
    await ActivityLog.deleteMany({
      resourceId: { $in: [projectId, ...taskIds, ...commentIds] },
    });

    await Project.findByIdAndDelete(projectId);

    await Workspace.findByIdAndUpdate(project.workspace, {
      $pull: { projects: projectId },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createProject, getProjectDetails, updateProject, deleteProject };
