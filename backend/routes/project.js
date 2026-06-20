import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../libs/validate-schema.js";
import { z } from "zod";
import {
  createProject,
  deleteProject,
  getProjectDetails,
  updateProject,
} from "../controllers/project-controller.js";

const router = express.Router();

router.post(
  "/:workspaceId/create-project",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
    }),
    body: projectSchema,
  }),
  createProject
);

router.get(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
  }),
  getProjectDetails
);

router.put(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: projectSchema.partial(),
  }),
  updateProject
);

router.delete(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
  }),
  deleteProject
);

export default router;
