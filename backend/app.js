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

  app.use(express.json());

  // Metrics middleware — đo request count + latency
  app.use(metricsMiddleware);

  app.get("/", async (req, res) => {
    res.status(200).json({ message: "Welcome to TaskManager API" });
  });

  // Prometheus metrics endpoint
  app.get("/metrics", metricsEndpoint);

  // http://localhost:5000/api-v1/
  app.use("/api-v1", routes);

  //error handling middleware
  app.use((err, req, res, next) => {
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    res.status(500).json({ message: "Internal Server Error" });
  });

  // not found middleware
  app.use((req, res, next) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
};

export default createApp;
