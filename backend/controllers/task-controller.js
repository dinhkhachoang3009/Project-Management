import Project from "../models/project.js";
import Task from "../models/task.js";
import ActivityLog from "../models/activity.js";
import { recordActivity } from "../libs/index.js";

const checkTaskPermission = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { error: "Task not found", status: 404 };

  const project = await Project.findById(task.project);
  if (!project) return { error: "Project not found", status: 404 };

  const isMember = project.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    return { error: "You are not a member of this project", status: 403 };
  }

  return { task, project, error: null };
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assignees } = req.body;

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

    let taskAssignees = assignees || [];
    const currentUserId = req.user._id.toString();
    const isCurrentUserInAssignees = taskAssignees.some(
      (id) => id === currentUserId || (id && id.toString() === currentUserId)
    );
    if (!isCurrentUserInAssignees) {
      taskAssignees.push(req.user._id);
    }

    const newTask = await Task.create({
      title,
      description,
      status: status || "To Do",
      priority: priority || "Medium",
      dueDate,
      project: projectId,
      assignees: taskAssignees,
      createdBy: req.user._id,
    });

    project.tasks.push(newTask._id);
    await project.save();

    recordActivity(
      req.user._id,
      "created_task",
      "Task",
      newTask._id,
      { title }
    );

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("members.user");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    })
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignees", "name email profilePicture")
      .populate("watchers", "name email profilePicture")
      .populate("createdBy", "name email profilePicture");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name email profilePicture"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    res.status(200).json({ task, project });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    task.title = title;
    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { field: "title", title }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    task.description = description;
    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { field: "description" }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { fields: Object.keys(req.body) }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const { task, error, status: statusCode } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(statusCode).json({ message: error });

    task.status = status;
    await task.save();

    const action = status === "Done" ? "completed_task" : "updated_task";
    recordActivity(
      req.user._id,
      action,
      "Task",
      task._id,
      { field: "status", status }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    task.priority = priority;
    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { field: "priority", priority }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    task.assignees = assignees;
    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { field: "assignees" }
    );

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const watchTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    const isWatching = task.watchers.some(
      (w) => w.toString() === req.user._id.toString()
    );

    if (isWatching) {
      task.watchers = task.watchers.filter(
        (w) => w.toString() !== req.user._id.toString()
      );
    } else {
      task.watchers.push(req.user._id);
    }

    await task.save();

    res.status(200).json({ message: isWatching ? "Unwatched" : "Watching" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const achieveTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    task.isArchived = !task.isArchived;
    await task.save();

    recordActivity(
      req.user._id,
      "updated_task",
      "Task",
      task._id,
      { field: "isArchived", isArchived: task.isArchived }
    );

    res.status(200).json({
      message: task.isArchived ? "Task archived" : "Task unarchived",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignees: req.user._id,
      isArchived: false,
    })
      .populate("project", "title workspace")
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    const subtask = { title, completed: false };
    task.subtasks.push(subtask);
    await task.save();

    const addedSubtask = task.subtasks[task.subtasks.length - 1];

    recordActivity(
      req.user._id,
      "created_subtask",
      "Task",
      task._id,
      { subtaskId: addedSubtask._id, title }
    );

    res.status(201).json(addedSubtask);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;

    const { task, error, status } = await checkTaskPermission(
      taskId,
      req.user._id
    );
    if (error) return res.status(status).json({ message: error });

    const subtask = task.subtasks.id(subTaskId);
    if (!subtask) return res.status(404).json({ message: "Subtask not found" });

    subtask.completed = completed;
    await task.save();

    const action = completed ? "updated_subtask" : "updated_subtask";
    recordActivity(
      req.user._id,
      action,
      "Task",
      task._id,
      { subtaskId: subTaskId, completed }
    );

    res.status(200).json(subtask);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getActivityByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const activities = await ActivityLog.find({ resourceId })
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskAssignees,
  watchTask,
  achieveTask,
  getMyTasks,
  addSubTask,
  updateSubTask,
  getActivityByResourceId,
};
