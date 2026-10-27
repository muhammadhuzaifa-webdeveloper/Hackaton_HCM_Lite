// config/db.js
import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP SRV DNS lookup issues with MongoDB Atlas (run only in local dev)
if (!process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch (e) {
    // ignore if in restricted environment
  }
}

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      (process.env.VERCEL ? null : "mongodb://127.0.0.1:27017/hcm_lite");

    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is missing on Vercel. Please add it to your Vercel Project Settings.");
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 9000,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;