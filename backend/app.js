import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import logger from "./libs/logger.js";
import { metricsMiddleware, metricsEndpoint } from "./libs/metrics.js";

// Pure so tests can exercise production config checks without env gymnastics:
// send-email.js's dotenv.config() may refill FRONTEND_URL during the import
// chain, making a module-load check both untestable and unreliable.
export function assertProductionFrontendUrl(env = process.env) {
  if (env.NODE_ENV === "production" && !env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL must be set in production");
  }
}

const createApp = () => {
  assertProductionFrontendUrl();

  const app = express();

  app.use(helmet());

  app.use(morgan("dev"));
  if (!process.env.FRONTEND_URL) {
    logger.warn("FRONTEND_URL is not set. CORS will allow all origins.");
  }

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  // G7: explicit body limit (body-parser's entity errors map below)
  app.use(express.json({ limit: "100kb" }));

  // Metrics middleware — đo request count + latency
  app.use(metricsMiddleware);

  app.get("/", async (req, res) => {
    res.status(200).json({ message: "Welcome to TaskManager API" });
  });

  // Prometheus metrics endpoint
  app.get("/metrics", metricsEndpoint);

  // http://localhost:5000/api-v1/
  app.use("/api-v1", routes);

  // not found middleware — registered BEFORE the error handler (Express
  // convention; unmatched requests get 404, bubbled errors still hit below)
  app.use((req, res, next) => {
    res.status(404).json({ message: "Not found" });
  });

  //error handling middleware — G7: universal { message } contract
  app.use((err, req, res, next) => {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: err.issues?.[0]?.message || "Invalid request" });
    }
    if (err.type === "entity.too.large") {
      return res.status(413).json({ message: "Request body too large" });
    }
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ message: "Malformed JSON body" });
    }
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    res.status(500).json({ message: "Internal Server Error" });
  });

  return app;
};

export default createApp;
