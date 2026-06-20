import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import { recordActivity } from "../libs/index.js";

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

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
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

    workspace.projects.push(newProject._id);
    await workspace.save();

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

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags ? tags.split(",") : [];
    if (members !== undefined) project.members = members;

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
