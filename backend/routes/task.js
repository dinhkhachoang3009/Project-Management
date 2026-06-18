import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskAssignees,
  watchTask,
  achieveTask,
  getMyTasks,
} from "../controllers/task-controller.js";

const router = express.Router();

router.post(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      status: z.enum(["To Do", "In Progress", "Done"]).optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      dueDate: z.string().optional(),
      assignees: z.array(z.string()).optional(),
    }),
  }),
  createTask
);

router.get("/my-tasks", authMiddleware, getMyTasks);

router.get(
  "/project/:projectId",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks
);

router.get(
  "/:taskId",
  authMiddleware,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getTaskById
);

router.put(
  "/:taskId/status",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ status: z.enum(["To Do", "In Progress", "Done"]) }),
  }),
  updateTaskStatus
);

router.put(
  "/:taskId/priority",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ priority: z.enum(["Low", "Medium", "High"]) }),
  }),
  updateTaskPriority
);

router.put(
  "/:taskId/assignees",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ assignees: z.array(z.string()) }),
  }),
  updateTaskAssignees
);

router.post(
  "/:taskId/watch",
  authMiddleware,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  watchTask
);

router.post(
  "/:taskId/archive",
  authMiddleware,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  achieveTask
);

export default router;
