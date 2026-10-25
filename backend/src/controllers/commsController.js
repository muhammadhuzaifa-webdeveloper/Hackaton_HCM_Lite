// controllers/commsController.js
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { logAudit } from "../utils/audit.js";

// --- Announcements ---
export const getAnnouncements = async (req, res) => {
  try {
    const role = req.user.role;
    const filter = {};

    if (role === "Employee") {
      filter.targetRole = { $in: ["All", "Employee"] };
    } else if (role === "HR") {
      filter.targetRole = { $in: ["All", "HR", "Employee"] };
    }

    const announcements = await Announcement.find(filter)
      .populate("author", "email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ announcements });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority = "normal", targetRole = "All" } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      priority,
      targetRole,
      author: req.user.userId,
      authorName: req.user.role === "Admin" ? "Company Administration" : "Human Resources",
    });

    await logAudit({
      req,
      action: "POST_ANNOUNCEMENT",
      entity: "Announcement",
      entityId: announcement._id,
      after: announcement.toObject(),
    });

    return res.status(201).json({ announcement });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });

    await Announcement.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: "DELETE_ANNOUNCEMENT",
      entity: "Announcement",
      entityId: req.params.id,
      before: item.toObject(),
    });

    return res.json({ message: "Announcement removed." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Notifications ---
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { isRead: true }
    );
    return res.json({ message: "Notification marked as read." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.userId, isRead: false }, { isRead: true });
    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Audit Log (Admin ONLY, immutable) ---
export const getAuditLogs = async (req, res) => {
  try {
    const { action, entity, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ logs, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
