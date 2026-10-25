import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import setupRoutes from "./routes/setupRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import commsRoutes from "./routes/commsRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // Allow localhost, 127.0.0.1, or configured CLIENT_ORIGIN
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/comms", commsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "HCM Lite",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected internal server error occurred.",
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`HCM Lite Backend running on http://localhost:${PORT}`);
  });
});
