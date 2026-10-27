// controllers/attendanceController.js
import Attendance from "../models/Attendance.js";
import CompanySetting from "../models/CompanySetting.js";
import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Notification from "../models/Notification.js";
import { isWithinOfficeGeofence } from "../utils/geo.js";
import { logAudit } from "../utils/audit.js";

// Helper: Formats today's date in YYYY-MM-DD
export function getTodayDateStr(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to get or auto-link an Employee record for any user role (including Admin/HR)
const getOrEnsureEmployeeId = async (user) => {
  if (user?.employeeId) return user.employeeId;
  const userId = user?.userId || user?._id;
  let emp = await Employee.findOne({ $or: [{ user: userId }, { email: user?.email }] });
  if (!emp && user?.email) {
    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${String(count + 1).padStart(3, "0")}`;
    const nameParts = user.email.split("@")[0].split(".");
    const firstName = nameParts[0] ? (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)) : "User";
    const lastName = nameParts[1] ? (nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)) : (user.role || "Staff");
    emp = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: user.email,
      status: "active",
      joiningDate: new Date(),
      user: userId,
    });
  }
  if (emp && userId) {
    await User.findByIdAndUpdate(userId, { employeeId: emp._id });
  }
  return emp?._id || null;
};

// 1. Get today's attendance status for logged-in employee
export const getMyTodayStatus = async (req, res) => {
  try {
    const employeeId = await getOrEnsureEmployeeId(req.user);
    if (!employeeId) {
      return res.status(400).json({ message: "No employee profile found for user." });
    }

    const todayStr = getTodayDateStr();
    const attendance = await Attendance.findOne({ employee: employeeId, date: todayStr }).lean();

    return res.json({
      date: todayStr,
      attendance: attendance || null,
      isCheckedIn: Boolean(attendance?.checkIn),
      isCheckedOut: Boolean(attendance?.checkOut),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. Check In
export const checkIn = async (req, res) => {
  try {
    const employeeId = await getOrEnsureEmployeeId(req.user);
    if (!employeeId) {
      return res.status(400).json({ message: "No employee profile found for user." });
    }

    const todayStr = getTodayDateStr();
    const serverNow = new Date(); // Server stamps the time

    // 1. Check if record already exists for today -> second check-in = 409
    const existing = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (existing && existing.checkIn) {
      return res.status(409).json({ message: "You have already checked in today (409 Conflict)." });
    }

    // 2. Load company rules
    const settings = await CompanySetting.findOne().lean();
    const officeStartTime = settings?.officeStartTime || "09:00"; // default 09:00
    const graceTimeMinutes = settings?.graceTimeMinutes ?? 15; // default 15 min

    // 3. Optional Camera & Geolocation checks (Bonus Section 5)
    const { latitude, longitude, accuracy, faceDetected, source = "web" } = req.body;
    let locationData = null;

    if (source === "camera") {
      if (!faceDetected) {
        return res.status(422).json({
          message: "Face recognition required. Attendance cannot be marked without a detected face.",
        });
      }
    }

    if (source === "camera" || (latitude !== undefined && longitude !== undefined)) {
      if (accuracy !== undefined && accuracy > 100) {
        return res.status(422).json({
          message: `GPS accuracy too low (${Math.round(accuracy)}m). Accuracy must be under 100m.`,
        });
      }

      if (settings?.officeLocation?.latitude && settings?.officeLocation?.longitude) {
        const geoCheck = isWithinOfficeGeofence(
          latitude,
          longitude,
          settings.officeLocation.latitude,
          settings.officeLocation.longitude,
          settings.officeLocation.radiusMeters || 150
        );

        locationData = {
          latitude,
          longitude,
          accuracy,
          distanceMeters: geoCheck.distanceMeters,
          isWithinRadius: geoCheck.isWithinRadius,
        };

        if (source === "camera" && !geoCheck.isWithinRadius) {
          return res.status(422).json({
            message: `Check-in rejected: You are ${geoCheck.distanceMeters}m away from the office (Allowed radius: ${settings.officeLocation.radiusMeters}m).`,
          });
        }
      }
    }

    // 4. Calculate if late: office start + grace (e.g. 09:00 + 15m = 09:15)
    const [startHour, startMin] = officeStartTime.split(":").map(Number);
    const thresholdMinutes = startHour * 60 + startMin + graceTimeMinutes;

    const checkInMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
    const isLate = checkInMinutes > thresholdMinutes;
    const initialStatus = isLate ? "late" : "present";

    let attendance;
    if (existing) {
      existing.checkIn = serverNow;
      existing.status = initialStatus;
      existing.source = source;
      existing.location = locationData;
      existing.faceDetected = Boolean(faceDetected);
      await existing.save();
      attendance = existing;
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date: todayStr,
        checkIn: serverNow,
        status: initialStatus,
        source,
        location: locationData,
        faceDetected: Boolean(faceDetected),
      });
    }

    await logAudit({
      req,
      action: "ATTENDANCE_CHECK_IN",
      entity: "Attendance",
      entityId: attendance._id,
      after: { date: todayStr, checkIn: serverNow, status: initialStatus, source },
    });

    return res.status(201).json({
      message: isLate ? "Checked in (Marked Late as after grace time)." : "Checked in successfully.",
      attendance,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already checked in today (409 Conflict)." });
    }
    return res.status(500).json({ message: err.message });
  }
};

// 3. Check Out
export const checkOut = async (req, res) => {
  try {
    const employeeId = await getOrEnsureEmployeeId(req.user);
    if (!employeeId) {
      return res.status(400).json({ message: "No employee profile found for user." });
    }

    const todayStr = getTodayDateStr();
    const serverNow = new Date();

    const attendance = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "You must check in first before checking out." });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "You have already checked out today." });
    }

    attendance.checkOut = serverNow;
    const durationMs = serverNow.getTime() - attendance.checkIn.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    attendance.durationMinutes = durationMinutes;

    // Check half day rule: under 5 hours = half_day
    const settings = await CompanySetting.findOne().lean();
    const halfDayThresholdHours = settings?.halfDayThresholdHours ?? 5;
    const halfDayMinutes = halfDayThresholdHours * 60;

    if (durationMinutes < halfDayMinutes) {
      attendance.status = "half_day";
    }

    await attendance.save();

    await logAudit({
      req,
      action: "ATTENDANCE_CHECK_OUT",
      entity: "Attendance",
      entityId: attendance._id,
      after: { date: todayStr, checkOut: serverNow, durationMinutes, status: attendance.status },
    });

    return res.json({
      message: attendance.status === "half_day" 
        ? "Checked out. Work duration was under 5h (Marked Half Day)."
        : "Checked out successfully.",
      attendance,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 4. Daily Attendance Board (for HR, Admin, and Employee)
export const getDailyBoard = async (req, res) => {
  try {
    const { date = getTodayDateStr(), department } = req.query;

    const empQuery = { status: "active" };
    if (department) empQuery.department = department;

    // Data scope guard: Employee can only see their own attendance row
    if (req.user?.role === "Employee") {
      if (req.user.employeeId) {
        empQuery._id = req.user.employeeId;
      } else {
        const emp = await Employee.findOne({ user: req.user._id });
        if (emp) empQuery._id = emp._id;
      }
    }

    const employees = await Employee.find(empQuery)
      .populate("department", "name")
      .populate("designation", "title")
      .sort({ employeeCode: 1 })
      .lean();

    const attendances = await Attendance.find({ date }).lean();
    const attMap = new Map(attendances.map((a) => [a.employee.toString(), a]));

    // Check approved leaves for this date
    const leaves = await LeaveRequest.find({
      status: "approved",
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).lean();
    const leaveMap = new Map(leaves.map((l) => [l.employee.toString(), l]));

    const board = employees.map((emp) => {
      const att = attMap.get(emp._id.toString());
      const onLeave = leaveMap.get(emp._id.toString());

      let status = "absent";
      if (att) {
        status = att.status;
      } else if (onLeave) {
        status = "on_leave";
      }

      return {
        employee: emp,
        attendance: att || null,
        status,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        durationMinutes: att?.durationMinutes || 0,
        source: att?.source || "-",
      };
    });

    return res.json({ date, board });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 5. Attendance Calendar (monthly view)
export const getAttendanceCalendar = async (req, res) => {
  try {
    const { month, employeeId } = req.query; // YYYY-MM
    const targetEmployeeId = req.user.role === "Employee" ? req.user.employeeId : employeeId;

    if (!targetEmployeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    const regex = month ? new RegExp(`^${month}`) : new RegExp(`^${getTodayDateStr().slice(0, 7)}`);

    const records = await Attendance.find({
      employee: targetEmployeeId,
      date: { $regex: regex },
    }).sort({ date: 1 }).lean();

    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 6. Request Attendance Correction (Employee)
export const requestCorrection = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) return res.status(400).json({ message: "No employee profile found." });

    const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;
    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required." });
    }

    let attendance = await Attendance.findOne({ employee: employeeId, date });
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date,
        status: "absent",
      });
    }

    attendance.correctionRequest = {
      requested: true,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      reason,
      status: "pending",
    };

    await attendance.save();

    await logAudit({
      req,
      action: "REQUEST_ATTENDANCE_CORRECTION",
      entity: "Attendance",
      entityId: attendance._id,
      after: { date, reason, requestedCheckIn, requestedCheckOut },
    });

    return res.json({ message: "Correction request submitted to HR.", attendance });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 7. Review Attendance Correction (HR / Admin)
export const reviewCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewComment } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approved' or 'rejected'." });
    }

    const attendance = await Attendance.findById(id).populate("employee");
    if (!attendance || !attendance.correctionRequest?.requested) {
      return res.status(404).json({ message: "Correction request not found." });
    }

    attendance.correctionRequest.status = action;
    attendance.correctionRequest.reviewedBy = req.user.userId;
    attendance.correctionRequest.reviewComment = reviewComment || "";
    attendance.correctionRequest.reviewedAt = new Date();

    if (action === "approved") {
      if (attendance.correctionRequest.requestedCheckIn) {
        attendance.checkIn = attendance.correctionRequest.requestedCheckIn;
      }
      if (attendance.correctionRequest.requestedCheckOut) {
        attendance.checkOut = attendance.correctionRequest.requestedCheckOut;
      }
      if (attendance.checkIn && attendance.checkOut) {
        const dur = Math.round((attendance.checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60));
        attendance.durationMinutes = dur;
        attendance.status = dur < 300 ? "half_day" : "present";
      } else {
        attendance.status = "present";
      }
      attendance.source = "correction";
    }

    await attendance.save();

    // Create in-app notification for employee
    if (attendance.employee?.user) {
      await Notification.create({
        user: attendance.employee.user,
        title: `Attendance Correction ${action.toUpperCase()}`,
        message: `Your correction request for ${attendance.date} was ${action}. Comment: ${reviewComment || "None"}`,
        type: "attendance",
      });
    }

    await logAudit({
      req,
      action: `CORRECTION_${action.toUpperCase()}`,
      entity: "Attendance",
      entityId: attendance._id,
      after: { action, reviewComment },
    });

    return res.json({ message: `Correction request ${action}.`, attendance });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 8. Manual Mark Attendance (Admin & HR can mark Present, Absent, Late, or Half Day)
export const manualMarkAttendance = async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;
    if (!employeeId || !date || !status) {
      return res.status(400).json({ message: "Employee, date, and status are required." });
    }

    if (!["present", "absent", "late", "half_day"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    let attendance = await Attendance.findOne({ employee: employeeId, date });
    const before = attendance ? attendance.toObject() : null;

    if (!attendance) {
      const now = new Date();
      attendance = new Attendance({
        employee: employeeId,
        date,
        status,
        source: "correction",
        checkIn: status !== "absent" ? now : null,
      });
    } else {
      attendance.status = status;
      if (status === "absent") {
        attendance.checkIn = null;
        attendance.checkOut = null;
        attendance.durationMinutes = 0;
      } else if (!attendance.checkIn) {
        attendance.checkIn = new Date();
      }
      attendance.source = "correction";
    }

    await attendance.save();

    await logAudit({
      req,
      action: "MANUAL_MARK_ATTENDANCE",
      entity: "Attendance",
      entityId: attendance._id,
      before,
      after: attendance.toObject(),
    });

    return res.json({ message: `Attendance marked as ${status.toUpperCase()} for ${date}.`, attendance });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
