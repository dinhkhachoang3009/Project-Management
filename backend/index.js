import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";

import routes from "./routes/index.js";
import logger from "./libs/logger.js";
dotenv.config();

const app = express();

app.use(morgan("dev"));
if (!process.env.FRONTEND_URL) {
  logger.warn("FRONTEND_URL is not set. CORS will allow all origins.");
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

//db connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB", { error: err.message });
  });

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.status(200).json({ message: "Welcome to TaskManager API" });
});
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

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
