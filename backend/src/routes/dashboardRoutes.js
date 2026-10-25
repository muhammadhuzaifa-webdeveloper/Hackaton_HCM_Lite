// routes/dashboardRoutes.js
import express from "express";
import {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
} from "../controllers/dashboardController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Admin Dashboard (Admin only)
router.get("/admin", authorizeRoles("Admin"), getAdminDashboard);

// HR Dashboard (HR and Admin)
router.get("/hr", authorizeRoles("Admin", "HR"), getHRDashboard);

// Employee Dashboard (All roles; self-service metrics)
router.get("/employee", getEmployeeDashboard);

export default router;
