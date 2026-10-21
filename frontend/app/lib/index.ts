import type { ProjectStatus, TaskStatus } from "@/types";

export const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
];

export const getTaskStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "On Hold":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Planning":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

// F6: single source of truth for task-priority chip colors. Call sites
// used to carry three different hand-rolled priority palettes.
export const getTaskPriorityColor = (priority: string | undefined): string => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "Medium":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getProjectProgress = (tasks: { status: TaskStatus }[]) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task?.status === "Done").length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return progress;
};
