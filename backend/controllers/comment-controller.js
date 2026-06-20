import Comment from "../models/comment.js";
import Task from "../models/task.js";
import { recordActivity } from "../libs/index.js";

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      text,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email profilePicture"
    );

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

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name email profilePicture")
      .sort({ createdAt: -1 });

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

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export { addComment, getCommentsByTaskId, deleteComment };
