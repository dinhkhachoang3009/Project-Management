import mongoose from "mongoose";
import dotenv from "dotenv";

import createApp from "./app.js";
import logger from "./libs/logger.js";

dotenv.config();

//db connection
const connectDB = async (attempt = 0) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("Failed to connect to MongoDB", {
      error: err.message,
      attempt: attempt + 1,
    });
    const delay = Math.min(5000 * (attempt + 1), 30000);
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

createApp().listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
