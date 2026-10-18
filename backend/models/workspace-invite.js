import mongoose from "mongoose";

const workspaceInviteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required for "email" invites only; "link" invites are not user-bound
      // validation is enforced in the controllers
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "link"],
      default: "email",
    },
    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      default: "member",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const WorkspaceInvite = mongoose.model(
  "WorkspaceInvite",
  workspaceInviteSchema
);

export default WorkspaceInvite;
