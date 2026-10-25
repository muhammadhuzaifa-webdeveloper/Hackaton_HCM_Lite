// routes/leaveRoutes.js
import express from "express";
import {
  getMyBalances,
  getLeaveRequests,
  applyLeave,
  cancelLeave,
  reviewLeave,
} from "../controllers/leaveController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Leave balances & summary
router.get("/balances", getMyBalances);

// Leave history / list
router.get("/requests", getLeaveRequests);

// Apply for leave (Employee, HR)
router.post("/apply", applyLeave);

// Cancel pending leave
router.patch("/requests/:id/cancel", cancelLeave);

// Approve or Reject with comment (HR and Admin only)
router.patch("/requests/:id/review", authorizeRoles("Admin", "HR"), reviewLeave);

export default router;
