import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskAssignees,
  watchTask,
  achieveTask,
  getMyTasks,
} from "../controllers/task-controller.js";
import {
  addComment,
  getCommentsByTaskId,
  deleteComment,
} from "../controllers/comment-controller.js";

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
  "/:taskId",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }),
  }),
  updateTask
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

router.post(
  "/:taskId/comments",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ text: z.string().min(1, "Comment text is required") }),
  }),
  addComment
);

router.get(
  "/:taskId/comments",
  authMiddleware,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getCommentsByTaskId
);

router.delete(
  "/comments/:commentId",
  authMiddleware,
  validateRequest({ params: z.object({ commentId: z.string() }) }),
  deleteComment
);

export default router;
