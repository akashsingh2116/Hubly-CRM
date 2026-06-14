import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  logger.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}
