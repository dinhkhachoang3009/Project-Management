import type { Task } from "@/types";

// E1b: builds /workspaces/:wsId/projects/:projectId/tasks/:taskId from a
// my-tasks payload, where getMyTasks populates `project` with "title
// workspace" (workspace as raw id string). Returns null when the workspace
// is unknown — callers must render a non-link in that case.
export const buildTaskDetailUrl = (
  task: Pick<Task, "_id" | "project">
): string | null => {
  const project = task.project as string | { _id?: string; workspace?: string | { _id?: string } } | undefined;

  let projectId: string | undefined;
  let workspaceId: string | undefined;

  if (typeof project === "string") {
    projectId = project;
  } else if (project) {
    projectId = project._id;
    workspaceId =
      typeof project.workspace === "string"
        ? project.workspace
        : project.workspace?._id;
  }

  if (!projectId || !workspaceId || !task._id) return null;

  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`;
};
