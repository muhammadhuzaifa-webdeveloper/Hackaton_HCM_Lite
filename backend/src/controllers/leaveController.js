// controllers/leaveController.js
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import Employee from "../models/Employee.js";
import Notification from "../models/Notification.js";
import { calculateWorkingDays } from "../utils/workingDays.js";
import { logAudit } from "../utils/audit.js";

// Helper: Calculate Leave Balances for an employee
export async function getEmployeeLeaveBalances(employeeId) {
  const leaveTypes = await LeaveType.find().lean();
  const currentYear = new Date().getFullYear();

  // Find all approved leaves for the employee in the current year
  const approvedLeaves = await LeaveRequest.find({
    employee: employeeId,
    status: "approved",
    startDate: { $gte: `${currentYear}-01-01` },
  }).lean();

  const usageByType = {};
  for (const leave of approvedLeaves) {
    const typeId = leave.leaveType.toString();
    usageByType[typeId] = (usageByType[typeId] || 0) + leave.workingDays;
  }

  const balances = leaveTypes.map((type) => {
    const used = usageByType[type._id.toString()] || 0;
    const quota = type.yearlyQuota;
    const remaining = type.name === "unpaid" ? "Unlimited" : Math.max(0, quota - used);

    return {
      leaveTypeId: type._id,
      name: type.name,
      displayName: type.displayName,
      quota,
      used,
      remaining,
      isPaid: type.isPaid,
    };
  });

  return balances;
}

// 1. Get Leave Balances & Summary
export const getMyBalances = async (req, res) => {
  try {
    const targetEmployeeId = req.user.role === "Employee" 
      ? req.user.employeeId 
      : (req.query.employeeId || req.user.employeeId);

    if (!targetEmployeeId) {
      // If Admin/HR does not have a linked employee profile, return standard leave types
      const leaveTypes = await LeaveType.find().lean();
      const balances = leaveTypes.map((lt) => ({
        leaveTypeId: lt._id,
        name: lt.name,
        displayName: lt.displayName,
        quota: lt.yearlyQuota,
        used: 0,
        remaining: lt.yearlyQuota,
        isPaid: lt.isPaid,
      }));
      return res.json({ balances });
    }

    const balances = await getEmployeeLeaveBalances(targetEmployeeId);
    return res.json({ balances });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. Get Leave History / Requests list
export const getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (req.user.role === "Employee") {
      query.employee = req.user.employeeId;
    } else {
      if (employeeId) query.employee = employeeId;
      if (status) query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate("employee", "employeeCode firstName lastName email department")
        .populate("leaveType", "name displayName yearlyQuota isPaid")
        .populate("reviewedBy", "email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LeaveRequest.countDocuments(query),
    ]);

    return res.json({ requests, total });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. Apply for Leave
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "No employee profile found." });
    }

    const { leaveTypeId, startDate, endDate, reason, smartParsed = false } = req.body;
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Leave type, start date, end date, and reason are required." });
    }

    // 1. Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // 2. Check Overlap = 422
    // Overlapping condition: (startA <= endB) and (endA >= startB) with status pending or approved
    const existingOverlap = await LeaveRequest.findOne({
      employee: employeeId,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (existingOverlap) {
      return res.status(422).json({
        message: `Leave overlap detected (422 Unprocessable Entity). You already have a ${existingOverlap.status} leave from ${existingOverlap.startDate} to ${existingOverlap.endDate}.`,
      });
    }

    // 3. Calculate Working Days (skipping weekends & holidays)
    const workingDays = await calculateWorkingDays(startDate, endDate);
    if (workingDays <= 0) {
      return res.status(422).json({
        message: "Selected leave period contains only non-working days (weekends or public holidays).",
      });
    }

    // 4. Check Balance / Over-balance = 422
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ message: "Selected leave type does not exist." });
    }

    if (leaveType.name !== "unpaid" && leaveType.yearlyQuota > 0) {
      const balances = await getEmployeeLeaveBalances(employeeId);
      const currentBalance = balances.find((b) => b.leaveTypeId.toString() === leaveTypeId.toString());
      const remainingQuota = currentBalance ? currentBalance.remaining : 0;

      if (workingDays > remainingQuota) {
        return res.status(422).json({
          message: `Insufficient leave balance (422 Over-balance). Requested: ${workingDays} working days, Available: ${remainingQuota} days.`,
        });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      employee: employeeId,
      leaveType: leaveTypeId,
      startDate,
      endDate,
      workingDays,
      reason: reason.trim(),
      status: "pending",
      smartParsed: Boolean(smartParsed),
    });

    await logAudit({
      req,
      action: "APPLY_LEAVE",
      entity: "LeaveRequest",
      entityId: leaveRequest._id,
      after: leaveRequest.toObject(),
    });

    return res.status(201).json({
      message: `Leave application submitted successfully for ${workingDays} working day(s).`,
      leaveRequest,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 4. Cancel Leave Request (Employee cancels own pending leave)
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id);

    if (!leave) return res.status(404).json({ message: "Leave request not found." });

    if (req.user.role === "Employee" && leave.employee.toString() !== req.user.employeeId) {
      return res.status(403).json({ message: "Forbidden: Cannot cancel someone else's leave." });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: `Cannot cancel a leave that is already ${leave.status}.` });
    }

    leave.status = "cancelled";
    await leave.save();

    await logAudit({
      req,
      action: "CANCEL_LEAVE",
      entity: "LeaveRequest",
      entityId: leave._id,
      after: { status: "cancelled" },
    });

    return res.json({ message: "Leave request cancelled successfully.", leave });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 5. Review Leave Request (HR / Admin approves or rejects with comment)
export const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewComment } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approved' or 'rejected'." });
    }

    const leave = await LeaveRequest.findById(id).populate("employee");
    if (!leave) return res.status(404).json({ message: "Leave request not found." });

    if (leave.status !== "pending") {
      return res.status(400).json({ message: `Leave request has already been ${leave.status}.` });
    }

    leave.status = action;
    leave.reviewedBy = req.user.userId;
    leave.reviewComment = reviewComment || "";
    leave.reviewedAt = new Date();
    await leave.save();

    // Notify employee
    if (leave.employee?.user) {
      await Notification.create({
        user: leave.employee.user,
        title: `Leave Request ${action.toUpperCase()}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} (${leave.workingDays} days) was ${action}. ${reviewComment ? `Note: ${reviewComment}` : ""}`,
        type: "leave",
      });
    }

    await logAudit({
      req,
      action: `LEAVE_${action.toUpperCase()}`,
      entity: "LeaveRequest",
      entityId: leave._id,
      after: { action, reviewComment },
    });

    return res.json({ message: `Leave request ${action} successfully.`, leave });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
