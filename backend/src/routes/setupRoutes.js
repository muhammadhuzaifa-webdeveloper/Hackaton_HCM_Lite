// routes/setupRoutes.js
import express from "express";
import {
  getSetupStatus,
  initializeSetup,
  getCompanySettings,
  updateCompanySettings,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  deleteDesignation,
  getLeaveTypes,
  updateLeaveType,
  getPublicHolidays,
  createPublicHoliday,
  deletePublicHoliday,
  getUsers,
  createUserByAdmin,
  createHRUser,
  toggleUserStatus,
  resetUserPassword,
  seedDemoData,
} from "../controllers/setupController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Public setup status & first-run initialization & optional demo seed
router.get("/status", getSetupStatus);
router.post("/initialize", initializeSetup);
router.post("/seed-demo", seedDemoData);

// Protected routes
router.use(authenticate);

// Settings
router.get("/company", authorizeRoles("Admin", "HR"), getCompanySettings);
router.put("/company", authorizeRoles("Admin"), updateCompanySettings);

// Departments
router.get("/departments", getDepartments);
router.post("/departments", authorizeRoles("Admin"), createDepartment);
router.delete("/departments/:id", authorizeRoles("Admin"), deleteDepartment);

// Designations
router.get("/designations", getDesignations);
router.post("/designations", authorizeRoles("Admin"), createDesignation);
router.delete("/designations/:id", authorizeRoles("Admin"), deleteDesignation);

// Leave Types
router.get("/leave-types", getLeaveTypes);
router.put("/leave-types/:id", authorizeRoles("Admin"), updateLeaveType);

// Public Holidays
router.get("/holidays", getPublicHolidays);
router.post("/holidays", authorizeRoles("Admin"), createPublicHoliday);
router.delete("/holidays/:id", authorizeRoles("Admin"), deletePublicHoliday);

// User Management (Admin only)
router.get("/users", authorizeRoles("Admin"), getUsers);
router.post("/users", authorizeRoles("Admin"), createUserByAdmin);
router.post("/users/hr", authorizeRoles("Admin"), createHRUser);
router.patch("/users/:id/status", authorizeRoles("Admin"), toggleUserStatus);
router.post("/users/:id/reset-password", authorizeRoles("Admin"), resetUserPassword);

export default router;
