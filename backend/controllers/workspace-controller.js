import crypto from "crypto";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import Task from "../models/task.js";
import Comment from "../models/comment.js";
import ActivityLog from "../models/activity.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../libs/send-email.js";
import { recordActivity } from "../libs/index.js";

const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });

    recordActivity(
      req.user._id,
      "created_workspace",
      "Workspace",
      workspace._id,
      { name }
    );

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(
      workspaceId
    ).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
      members: { $elemMatch: { user: req.user._id } },
    })
      .populate("tasks", "status")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ projects, workspace });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const userMemberInfo = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMemberInfo || !["admin", "owner"].includes(userMemberInfo.role)) {
      return res.status(403).json({
        message: "You are not authorized to invite members to this workspace",
      });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === existingUser._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "User already a member of this workspace",
      });
    }

    const isInvited = await WorkspaceInvite.findOne({
      user: existingUser._id,
      workspaceId: workspaceId,
    });

    if (isInvited && isInvited.expiresAt > new Date()) {
      return res.status(400).json({
        message: "User already invited to this workspace",
      });
    }

    if (isInvited && isInvited.expiresAt < new Date()) {
      await WorkspaceInvite.deleteOne({ _id: isInvited._id });
    }

    const inviteToken = jwt.sign(
      {
        user: existingUser._id,
        workspaceId: workspaceId,
        role: role || "member",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await WorkspaceInvite.create({
      user: existingUser._id,
      workspaceId: workspaceId,
      token: inviteToken,
      role: role || "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;

    const emailContent = `
      <p>You have been invited to join ${workspace.name} workspace</p>
      <p>Click here to join: <a href="${invitationLink}">${invitationLink}</a></p>
    `;

    await sendEmail(
      email,
      "You have been invited to join a workspace",
      emailContent
    );

    res.status(200).json({
      message: "Invitation sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createInviteLink = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const role = req.body?.role || "member";

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const userMemberInfo = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMemberInfo || !["admin", "owner"].includes(userMemberInfo.role)) {
      return res.status(403).json({
        message:
          "You are not authorized to create an invite link for this workspace",
      });
    }

    const regenerate = req.body?.regenerate === true;

    // idempotent: re-opening the dialog must not silently revoke a link the
    // admin may already have shared — regeneration is explicit
    if (!regenerate) {
      const activeLinkInvite = await WorkspaceInvite.findOne({
        workspaceId: workspace._id,
        type: "link",
        expiresAt: { $gt: new Date() },
      });

      if (activeLinkInvite) {
        return res.status(200).json({
          message: "Invite link created",
          link: `${process.env.FRONTEND_URL}/workspace-invite/${workspaceId}?tk=${activeLinkInvite.token}`,
        });
      }
    }

    // regeneration (or no active link) revokes previous link invites
    await WorkspaceInvite.deleteMany({
      workspaceId: workspace._id,
      type: "link",
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // jti nonce: a regenerated link is always a distinct token, even when
    // two generations land in the same second (jwt iat granularity)
    const token = jwt.sign(
      {
        workspaceId: workspace._id,
        role,
        purpose: "workspace-join",
        jti: crypto.randomUUID(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await WorkspaceInvite.create({
      workspaceId: workspace._id,
      token,
      type: "link",
      role,
      expiresAt,
    });

    res.status(200).json({
      message: "Invite link created",
      link: `${process.env.FRONTEND_URL}/workspace-invite/${workspaceId}?tk=${token}`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const acceptGenerateInvite = async (req, res) => {
  // Open "join by raw link" is closed (decision D3); joining now requires a
  // token-gated invite link created by an admin/owner (createInviteLink).
  return res.status(400).json({
    message:
      "Invalid invite link. Please use the link shared by a workspace admin.",
  });
};

const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

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

    const [totalProjects, projects] = await Promise.all([
      Project.countDocuments({ workspace: workspaceId, isArchived: false }),
      Project.find({ workspace: workspaceId, isArchived: false })
        .populate(
          "tasks",
          "title status dueDate project updatedAt createdAt isArchived priority"
        )
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // locked D3 contract: archived tasks are excluded from ALL dashboard
    // numbers — filter once here; totals, charts, trends, upcoming and
    // productivity all read from this single filtered list
    const tasks = projects.flatMap((project) =>
      project.tasks.filter((task) => task.isArchived === false)
    );

    const totalTasks = tasks.length;

    const totalProjectInProgress = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    const totalTaskCompleted = tasks.filter(
      (task) => task.status === "Done"
    ).length;

    const totalTaskToDo = tasks.filter((task) => task.status === "To Do")
      .length;

    const totalTaskInProgress = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const upcomingTasks = tasks
      .filter((task) => task.status !== "Done")
      .filter((task) => {
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        return (
          taskDate > today &&
          taskDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        );
      });

    const taskTrendsData = [
      { name: "Sun", completed: 0, inProgress: 0, todo: 0 },
      { name: "Mon", completed: 0, inProgress: 0, todo: 0 },
      { name: "Tue", completed: 0, inProgress: 0, todo: 0 },
      { name: "Wed", completed: 0, inProgress: 0, todo: 0 },
      { name: "Thu", completed: 0, inProgress: 0, todo: 0 },
      { name: "Fri", completed: 0, inProgress: 0, todo: 0 },
      { name: "Sat", completed: 0, inProgress: 0, todo: 0 },
    ];

    // D4: bucket by createdAt with UTC day math (the container's TZ must not
    // shift which day a task lands in, nor the weekday label)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      return date;
    }).reverse();

    for (const task of tasks) {
      const taskDate = new Date(task.createdAt);

      const dayInDate = last7Days.findIndex(
        (date) =>
          date.getUTCDate() === taskDate.getUTCDate() &&
          date.getUTCMonth() === taskDate.getUTCMonth() &&
          date.getUTCFullYear() === taskDate.getUTCFullYear()
      );

      if (dayInDate !== -1) {
        const dayName = last7Days[dayInDate].toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });

        const dayData = taskTrendsData.find((day) => day.name === dayName);

        if (dayData) {
          switch (task.status) {
            case "Done":
              dayData.completed++;
              break;
            case "In Progress":
              dayData.inProgress++;
              break;
            case "To Do":
              dayData.todo++;
              break;
          }
        }
      }
    }

    const projectStatusData = [
      { name: "Completed", value: 0, color: "#10b981" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Planning", value: 0, color: "#f59e0b" },
      { name: "On Hold", value: 0, color: "#eab308" },
      { name: "Cancelled", value: 0, color: "#ef4444" },
    ];

    for (const project of projects) {
      switch (project.status) {
        case "Completed":
          projectStatusData[0].value++;
          break;
        case "In Progress":
          projectStatusData[1].value++;
          break;
        case "Planning":
          projectStatusData[2].value++;
          break;
        case "On Hold":
          projectStatusData[3].value++;
          break;
        case "Cancelled":
          projectStatusData[4].value++;
          break;
      }
    }

    const taskPriorityData = [
      { name: "High", value: 0, color: "#ef4444" },
      { name: "Medium", value: 0, color: "#f59e0b" },
      { name: "Low", value: 0, color: "#6b7280" },
    ];

    for (const task of tasks) {
      switch (task.priority) {
        case "High":
          taskPriorityData[0].value++;
          break;
        case "Medium":
          taskPriorityData[1].value++;
          break;
        case "Low":
          taskPriorityData[2].value++;
          break;
      }
    }

    const workspaceProductivityData = [];

    for (const project of projects) {
      const projectTask = tasks.filter(
        (task) => task.project.toString() === project._id.toString()
      );

      const completedTask = projectTask.filter(
        (task) => task.status === "Done" && task.isArchived === false
      );

      workspaceProductivityData.push({
        name: project.title,
        completed: completedTask.length,
        total: projectTask.length,
      });
    }

    const stats = {
      totalProjects,
      totalTasks,
      totalProjectInProgress,
      totalTaskCompleted,
      totalTaskToDo,
      totalTaskInProgress,
    };

    res.status(200).json({
      stats,
      taskTrendsData,
      projectStatusData,
      taskPriorityData,
      workspaceProductivityData,
      upcomingTasks,
      recentProjects: projects.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const acceptInviteByToken = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const workspace = await Workspace.findById(decoded.workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    if (decoded.purpose !== "workspace-join" && !decoded.user) {
      // not an email invite and not a link invite — e.g. a session token
      return res.status(401).json({ message: "Unauthorized" });
    }

    const targetUserId =
      decoded.purpose === "workspace-join" ? req.user._id : decoded.user;

    const isMember = workspace.members.some(
      (member) => member.user.toString() === targetUserId.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "You are already a member of this workspace",
      });
    }

    const inviteInfo = await WorkspaceInvite.findOne(
      decoded.purpose === "workspace-join"
        ? { workspaceId: workspace._id, token, type: "link" }
        : { user: decoded.user, workspaceId: workspace._id }
    );

    if (!inviteInfo) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (inviteInfo.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Invitation has expired",
      });
    }

    workspace.members.push({
      user: targetUserId,
      role: decoded.role || "member",
      joinedAt: new Date(),
    });

    await workspace.save();

    // email invites are single-use; link invites stay valid until expiry
    if (decoded.purpose !== "workspace-join") {
      await WorkspaceInvite.deleteOne({ _id: inviteInfo._id });
    }

    recordActivity(
      targetUserId,
      "joined_workspace",
      "Workspace",
      workspace._id,
      { method: "token" }
    );

    res.status(200).json({
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invitation has expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, color } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userMemberInfo = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMemberInfo || !["admin", "owner"].includes(userMemberInfo.role)) {
      return res.status(403).json({
        message: "You are not authorized to update this workspace",
      });
    }

    workspace.name = name || workspace.name;
    workspace.description = description !== undefined ? description : workspace.description;
    workspace.color = color || workspace.color;

    await workspace.save();

    recordActivity(
      req.user._id,
      "updated_workspace",
      "Workspace",
      workspace._id,
      { name }
    );

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only workspace owner can delete this workspace",
      });
    }

    // B2 cascade: workspace → projects → tasks → comments, plus every
    // activity row whose resource was any of them (children first, parent
    // last; no transaction — see deleteProject).
    const projectIds = await Project.find({ workspace: workspaceId }).distinct("_id");
    const taskIds = projectIds.length
      ? await Task.find({ project: { $in: projectIds } }).distinct("_id")
      : [];
    const commentIds = taskIds.length
      ? await Comment.find({ task: { $in: taskIds } }).distinct("_id")
      : [];

    if (taskIds.length) {
      await Task.deleteMany({ project: { $in: projectIds } });
    }
    if (commentIds.length) {
      await Comment.deleteMany({ task: { $in: taskIds } });
    }
    await ActivityLog.deleteMany({
      resourceId: { $in: [workspaceId, ...projectIds, ...taskIds, ...commentIds] },
    });
    if (projectIds.length) {
      await Project.deleteMany({ workspace: workspaceId });
    }

    await Workspace.findByIdAndDelete(workspaceId);

    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaceStats,
  inviteUserToWorkspace,
  createInviteLink,
  acceptGenerateInvite,
  acceptInviteByToken,
  updateWorkspace,
  deleteWorkspace,
};
