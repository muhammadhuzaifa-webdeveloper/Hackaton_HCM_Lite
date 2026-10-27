// controllers/dashboardController.js
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import PayrollRun from "../models/PayrollRun.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
import Announcement from "../models/Announcement.js";
import { getTodayDateStr, getOrEnsureEmployeeId } from "./attendanceController.js";
import { getEmployeeLeaveBalances } from "./leaveController.js";

// 1. Admin Dashboard Metrics (Server Aggregations)
export const getAdminDashboard = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;

    // Headcount & Status
    const totalActive = await Employee.countDocuments({ ...filter, status: "active" });
    const totalProbation = await Employee.countDocuments({ ...filter, status: "probation" });
    const totalExited = await Employee.countDocuments({ ...filter, status: "exited" });
    const totalHeadcount = totalActive + totalProbation;

    // Attrition YTD formula: Exits in period / Average headcount * 100
    const avgHeadcount = (totalHeadcount + totalExited) / 2 || 1;
    const attritionRate = Math.round((totalExited / avgHeadcount) * 100 * 10) / 10;

    // Latest Payroll Run Stats
    const latestPayroll = await PayrollRun.findOne({ status: "finalized" }).sort({ month: -1 }).lean();
    const payrollCost = latestPayroll?.totalNet || 0;
    const totalGross = latestPayroll?.totalGross || 0;

    // Average Gross Salary
    const salaryAgg = await Employee.aggregate([
      { $match: { status: { $in: ["active", "probation"] }, ...(filter.department ? { department: filter.department } : {}) } },
      { $group: { _id: null, avgGross: { $avg: "$salaryStructure.gross" }, avgBasic: { $avg: "$salaryStructure.basic" } } },
    ]);
    const avgSalary = Math.round(salaryAgg[0]?.avgGross || 0);

    // Headcount by Department
    const headcountByDept = await Employee.aggregate([
      { $match: { status: { $in: ["active", "probation"] } } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $project: {
          departmentName: "$dept.name",
          departmentCode: "$dept.code",
          count: 1,
        },
      },
    ]);

    // Gender breakdown
    const genderDist = await Employee.aggregate([
      { $match: { status: { $in: ["active", "probation"] } } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // Audit feed (latest 10 entries)
    const auditFeed = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean();

    return res.json({
      kpis: {
        headcount: totalHeadcount,
        active: totalActive,
        probation: totalProbation,
        attritionRate,
        payrollCost,
        avgSalary,
        latestPayrollMonth: latestPayroll?.month || "None",
      },
      headcountByDept,
      genderDist,
      auditFeed,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. HR Dashboard Metrics
export const getHRDashboard = async (req, res) => {
  try {
    const { department } = req.query;
    const todayStr = getTodayDateStr();
    const currentMonth = todayStr.slice(0, 7);

    const empFilter = { status: "active" };
    if (department) empFilter.department = department;

    const [totalActive, todayAttendances, todayLeaves, pendingLeaves, pendingCorrections] =
      await Promise.all([
        Employee.countDocuments(empFilter),
        Attendance.find({ date: todayStr }).populate("employee").lean(),
        LeaveRequest.find({
          status: "approved",
          startDate: { $lte: todayStr },
          endDate: { $gte: todayStr },
        }).lean(),
        LeaveRequest.countDocuments({ status: "pending" }),
        Attendance.countDocuments({ "correctionRequest.status": "pending" }),
      ]);

    // Categorize today's attendance
    let presentToday = 0;
    let lateToday = 0;
    let halfDayToday = 0;

    for (const att of todayAttendances) {
      if (att.status === "present") presentToday++;
      else if (att.status === "late") lateToday++;
      else if (att.status === "half_day") halfDayToday++;
    }

    const onLeaveToday = todayLeaves.length;
    const recordedCount = presentToday + lateToday + halfDayToday;
    const absentToday = Math.max(0, totalActive - recordedCount - onLeaveToday);

    // Attendance Rate Formula: (present + late + missing_checkout + 0.5 * half_day) / (active - on_leave)
    const effectiveWorkingHeadcount = Math.max(1, totalActive - onLeaveToday);
    const attendancePoints = presentToday + lateToday + 0.5 * halfDayToday;
    const attendanceRate = Math.round((attendancePoints / effectiveWorkingHeadcount) * 100);

    // Top 5 Late-comers this month
    const topLateComers = await Attendance.aggregate([
      { $match: { date: { $regex: new RegExp(`^${currentMonth}`) }, status: "late" } },
      { $group: { _id: "$employee", lateCount: { $sum: 1 } } },
      { $sort: { lateCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "emp",
        },
      },
      { $unwind: "$emp" },
      {
        $lookup: {
          from: "departments",
          localField: "emp.department",
          foreignField: "_id",
          as: "dept",
        },
      },
      {
        $project: {
          lateCount: 1,
          employeeCode: "$emp.employeeCode",
          employeeName: { $concat: ["$emp.firstName", " ", "$emp.lastName"] },
          department: { $arrayElemAt: ["$dept.name", 0] },
        },
      },
    ]);

    // Leave by Type breakdown this month
    const leaveByType = await LeaveRequest.aggregate([
      { $match: { status: "approved", startDate: { $regex: new RegExp(`^${currentMonth}`) } } },
      { $group: { _id: "$leaveType", totalDays: { $sum: "$workingDays" } } },
      {
        $lookup: {
          from: "leavetypes",
          localField: "_id",
          foreignField: "_id",
          as: "type",
        },
      },
      { $unwind: "$type" },
      {
        $project: {
          leaveTypeName: "$type.displayName",
          totalDays: 1,
        },
      },
    ]);

    return res.json({
      kpis: {
        totalHeadcount: totalActive,
        presentToday,
        lateToday,
        halfDayToday,
        absentToday,
        onLeaveToday,
        attendanceRate: Math.min(100, attendanceRate),
        pendingApprovals: pendingLeaves + pendingCorrections,
        pendingLeaves,
        pendingCorrections,
      },
      topLateComers,
      leaveByType,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. Employee Dashboard Metrics (Self-service)
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = await getOrEnsureEmployeeId(req.user);
    if (!employeeId) {
      return res.json({
        todayAttendance: null,
        hoursThisWeek: 0,
        weeklyTargetHours: 40,
        lateCountThisMonth: 0,
        leaveBalances: [],
        lastPayslip: null,
        announcements: [],
      });
    }

    const todayStr = getTodayDateStr();
    const currentMonth = todayStr.slice(0, 7);

    // 1. Today's attendance
    const todayAttendance = await Attendance.findOne({ employee: employeeId, date: todayStr }).lean();

    // 2. Late count this month
    const lateCount = await Attendance.countDocuments({
      employee: employeeId,
      date: { $regex: new RegExp(`^${currentMonth}`) },
      status: "late",
    });

    // 3. Hours worked this week vs 40 hours target
    // Find Monday of current week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    const mondayStr = getTodayDateStr(monday);

    const weekAttendances = await Attendance.find({
      employee: employeeId,
      date: { $gte: mondayStr, $lte: todayStr },
    }).lean();

    const totalMinutesThisWeek = weekAttendances.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const hoursThisWeek = Math.round((totalMinutesThisWeek / 60) * 10) / 10;

    // 4. Leave balances
    const leaveBalances = await getEmployeeLeaveBalances(employeeId);

    // 5. Last payslip
    const latestPayrollRun = await PayrollRun.findOne({
      status: "finalized",
      "items.employee": employeeId,
    })
      .sort({ month: -1 })
      .lean();

    const lastPayslip = latestPayrollRun
      ? latestPayrollRun.items.find((it) => it.employee.toString() === employeeId.toString())
      : null;

    // 6. Recent announcements
    const announcements = await Announcement.find({
      targetRole: { $in: ["All", "Employee"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      todayAttendance,
      hoursThisWeek,
      weeklyTargetHours: 40,
      lateCountThisMonth: lateCount,
      leaveBalances,
      lastPayslip: lastPayslip ? { ...lastPayslip, month: latestPayrollRun.month, payrollRunId: latestPayrollRun._id } : null,
      announcements,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
