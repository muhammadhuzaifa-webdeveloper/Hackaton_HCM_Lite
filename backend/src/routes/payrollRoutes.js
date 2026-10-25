// routes/payrollRoutes.js
import express from "express";
import {
  createPayrollDraft,
  getPayrollRuns,
  getPayrollRunById,
  finalizePayrollRun,
  getMyPayslips,
  downloadPayslipPDF,
} from "../controllers/payrollController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// HR/Admin can create and view runs
router.post("/draft", authorizeRoles("Admin", "HR"), createPayrollDraft);
router.get("/runs", authorizeRoles("Admin", "HR"), getPayrollRuns);
router.get("/runs/:id", authorizeRoles("Admin", "HR"), getPayrollRunById);

// Admin ONLY can finalize and lock
router.post("/runs/:id/finalize", authorizeRoles("Admin"), finalizePayrollRun);

// Employee payslips self-service
router.get("/my-payslips", getMyPayslips);

// Payslip PDF download (scoped per role)
router.get("/runs/:id/payslip/:employeeId/pdf", downloadPayslipPDF);

export default router;
