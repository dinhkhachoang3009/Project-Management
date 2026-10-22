import aj from "./arcjet.js";
import logger from "./logger.js";

// G6 (+review): one Arcjet entry point for every auth path.
// - deny             → answer per verdict: EMAIL verdicts keep the original
//                      register contract (403 "Invalid email address"),
//                      everything else (rate limits, bots) → 429.
// - Arcjet error     → fail CLOSED with 503 — a dead gate must not silently
//                      open the auth endpoints to floods.
const TOO_MANY_MESSAGE = "Too many requests. Please try again later.";
const UNAVAILABLE_MESSAGE = "Service temporarily unavailable.";

export const arcjetGuard = async (req, res, extra = {}) => {
  let decision;
  try {
    decision = await aj.protect(req, extra);
  } catch (error) {
    logger.error("Arcjet guard error (fail-closed 503)", {
      error: error.message,
      stack: error.stack,
    });
    res.status(503).json({ message: UNAVAILABLE_MESSAGE });
    return false;
  }

  if (decision && decision.isDenied()) {
    const verdictType = decision.reason?.type;
    if (verdictType === "EMAIL") {
      res.status(403).json({ message: "Invalid email address" });
      return false;
    }
    res.status(429).json({ message: TOO_MANY_MESSAGE });
    return false;
  }

  return true;
};
