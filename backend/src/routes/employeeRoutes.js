// routes/employeeRoutes.js
import express from "express";
import {
  getEmployees,
  registerEmployee,
  getEmployee360,
  updateEmployee,
  updateSelfProfile,
  csvImportDryRun,
  csvImportCommit,
  csvExportEmployees,
  confirmEmployee,
} from "../controllers/employeeController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Directory & Search (All roles; Employees see own scoped record)
router.get("/", getEmployees);

// Register Employee (HR and Admin only)
router.post("/", authorizeRoles("Admin", "HR"), registerEmployee);

// Confirm / Approve Employee (HR and Admin only)
router.patch("/:id/confirm", authorizeRoles("Admin", "HR"), confirmEmployee);

// Employee Self-service: update phone & address
router.patch("/self", updateSelfProfile);

// CSV import dry run & commit, and CSV export (HR and Admin only)
router.post("/csv-dry-run", authorizeRoles("Admin", "HR"), csvImportDryRun);
router.post("/csv-commit", authorizeRoles("Admin", "HR"), csvImportCommit);
router.get("/csv-export", authorizeRoles("Admin", "HR"), csvExportEmployees);

// Employee 360 view (All roles; scoped to self if Employee)
router.get("/:id/360", getEmployee360);

// Update Employee (HR and Admin only)
router.put("/:id", authorizeRoles("Admin", "HR"), updateEmployee);

export default router;
