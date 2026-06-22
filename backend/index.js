import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";

import routes from "./routes/index.js";
dotenv.config();

const app = express();

app.use(morgan("dev"));

// Debug log: check critical env vars exist (without leaking values)
console.log("[DEBUG] PORT:", process.env.PORT || "not set, using default 5000");
console.log("[DEBUG] MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("[DEBUG] MONGO_URI prefix:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + "..." : "undefined");
console.log("[DEBUG] FRONTEND_URL:", process.env.FRONTEND_URL || "not set");
console.log("[DEBUG] NODE_ENV:", process.env.NODE_ENV || "not set");

if (!process.env.FRONTEND_URL) {
  console.warn("⚠️  Warning: FRONTEND_URL is not set. CORS will allow all origins.");
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
if (!process.env.MONGO_URI) {
  console.error("[FATAL] MONGO_URI is not defined. Cannot connect to database.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
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
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// not found middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
