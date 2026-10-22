import ActivityLog from "../models/activity.js";
import logger from "../libs/logger.js";

const recordActivity = async (
  userId,
  action,
  resourceType,
  resourceId,
  details
) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      details,
    });
  } catch (error) {
    // G12: fire-and-forget by contract; never let logging a failure throw
    logger.error("Activity log failed", {
      error: error.message,
      stack: error.stack,
    });
  }
};

export { recordActivity };
