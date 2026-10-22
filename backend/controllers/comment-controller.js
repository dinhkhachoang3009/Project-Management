import Comment from "../models/comment.js";
import ActivityLog from "../models/activity.js";
import { recordActivity } from "../libs/index.js";
import { resolveTaskMember } from "../libs/permissions.js";

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const { error, status } = await resolveTaskMember(taskId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      text,
    });

    // G11: no re-find — the auth'd user doc already carries the identity
    // fields the client renders (G1 keeps them in the lean req.user)
    const populatedComment = {
      ...comment.toObject(),
      author: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
      },
    };

    recordActivity(
      req.user._id,
      "added_comment",
      "Comment",
      comment._id,
      { taskId }
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { error, status } = await resolveTaskMember(taskId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name email profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this comment",
      });
    }

    await Comment.deleteOne({ _id: commentId });

    // B7: a deleted comment takes its added_comment activity rows with it
    await ActivityLog.deleteMany({
      resourceType: "Comment",
      resourceId: commentId,
    });

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export { addComment, getCommentsByTaskId, deleteComment };
