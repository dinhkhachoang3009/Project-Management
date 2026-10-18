import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  changePassword,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.js";
import { changePasswordSchema } from "../libs/validate-schema.js";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

const router = express.Router();

router.get("/profile", authMiddleware, getUserProfile);

router.put(
  "/profile",
  authMiddleware,
  validateRequest({
    body: z.object({
      name: z.string(),
      profilePicture: z.string().optional(),
    }),
  }),
  updateUserProfile
);

router.put(
  "/change-password",
  authMiddleware,
  validateRequest({
    body: changePasswordSchema,
  }),
  changePassword
);

export default router;
