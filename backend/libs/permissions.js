import Task from "../models/task.js";
import Project from "../models/project.js";

// Single canonical task -> project -> membership chain. Returns
// { task, project, error, status }: on success error is null and task/project
// are the unpopulated docs (callers populate what they need).
const resolveTaskMember = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    return { error: "Task not found", status: 404 };
  }

  const project = await Project.findById(task.project);
  if (!project) {
    return { error: "Project not found", status: 404 };
  }

  const isMember = project.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    return {
      error: "You are not a member of this project",
      status: 403,
    };
  }

  return { task, project, error: null };
};

export { resolveTaskMember };
