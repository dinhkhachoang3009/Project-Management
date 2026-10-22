import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../libs/logger.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (decoded.purpose) {
      // Verify/reset/join tokens are not session tokens.
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // G1: lean + projection — every controller only reads req.user._id, but
    // the identity fields ride along for the addComment author build (G11).
    // Re-verify with grep before reading any other field from req.user.
    const user = await User.findById(decoded.userId)
      .select("_id name email profilePicture")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Auth middleware rejected request", {
      error: error.message,
      stack: error.stack,
    });
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export default authMiddleware;
