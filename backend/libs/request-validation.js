import logger from "./logger.js";

// G7: universal error contract — { message: string } with 400 for failed
// request validation. Replaces zod-express-middleware's {type, errors} shape
// so every client has exactly one error shape to render.

const sendFirstIssue = (res, zodError) => {
  const issue = zodError?.issues?.[0];
  const message =
    issue?.message ||
    (zodError ? "Invalid request" : "Request validation failed");
  if (!issue) {
    logger.error("Validation middleware got an unexpected error", {
      error: zodError && zodError.message,
    });
  }
  return res.status(400).json({ message });
};

const validate = (source) => (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    return sendFirstIssue(res, parsed.error);
  }
  if (parsed.data !== undefined) {
    req[source] = parsed.data;
  }
  return next();
};

export const validateBody = validate("body");
export const validateParams = validate("params");
export const validateQuery = validate("query");

// Drop-in for zod-express-middleware's object form:
// validateRequest({ body, params, query }) → same 400s with { message }.
const runSteps = (steps, req, res, next, i = 0) => {
  if (i >= steps.length) return next();
  steps[i](req, res, (err) =>
    err ? next(err) : runSteps(steps, req, res, next, i + 1)
  );
};

export const validateRequest = (shapes = {}) => {
  const steps = [
    shapes.body ? validate("body")(shapes.body) : null,
    shapes.params ? validate("params")(shapes.params) : null,
    shapes.query ? validate("query")(shapes.query) : null,
  ].filter(Boolean);

  return (req, res, next) => runSteps(steps, req, res, next);
};
