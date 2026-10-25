// routes/attendanceRoutes.js
import express from "express";
import {
  getMyTodayStatus,
  checkIn,
  checkOut,
  getDailyBoard,
  getAttendanceCalendar,
  requestCorrection,
  reviewCorrection,
  manualMarkAttendance,
} from "../controllers/attendanceController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Employee check-in / check-out
router.get("/today", getMyTodayStatus);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);

// Daily Board (All roles; scoped to self if Employee)
router.get("/board", authorizeRoles("Admin", "HR", "Employee"), getDailyBoard);
router.post("/manual-mark", authorizeRoles("Admin", "HR"), manualMarkAttendance);

// Monthly Calendar (All roles; scoped to self if Employee)
router.get("/calendar", getAttendanceCalendar);

// Corrections
router.post("/correction", requestCorrection);
router.patch("/correction/:id", authorizeRoles("Admin", "HR"), reviewCorrection);

export default router;
