// routes/commsRoutes.js
import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
} from "../controllers/commsController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Announcements (Read by all; Post by Admin/HR)
router.get("/announcements", getAnnouncements);
router.post("/announcements", authorizeRoles("Admin", "HR"), createAnnouncement);
router.delete("/announcements/:id", authorizeRoles("Admin", "HR"), deleteAnnouncement);

// Notifications (Personal inbox)
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

// Audit Logs (Admin ONLY)
router.get("/audit", authorizeRoles("Admin"), getAuditLogs);

export default router;
