// controllers/payrollController.js
import PayrollRun from "../models/PayrollRun.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import CompanySetting from "../models/CompanySetting.js";
import Notification from "../models/Notification.js";
import { getMonthWorkingDays, calculateWorkingDays } from "../utils/workingDays.js";
import { calculateTax } from "../utils/taxCalculator.js";
import { generatePayslipPDF } from "../utils/pdfGenerator.js";
import { logAudit } from "../utils/audit.js";

// 1. Generate or Preview Payroll Draft (HR or Admin)
export const createPayrollDraft = async (req, res) => {
  try {
    const { month } = req.body; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Valid month in YYYY-MM format is required." });
    }

    // Check if payroll run already exists for this month
    let existingRun = await PayrollRun.findOne({ month });
    if (existingRun && existingRun.status === "finalized") {
      return res.status(400).json({
        message: `Payroll for ${month} is already FINALIZED and LOCKED. It cannot be recalculated.`,
      });
    }

    // 1. Calculate working days in the month
    const workingDaysInMonth = await getMonthWorkingDays(month);
    if (workingDaysInMonth <= 0) {
      return res.status(400).json({ message: "No working days found for this month." });
    }

    const settings = await CompanySetting.findOne().lean();
    const latePenaltyEnabled = settings?.latePenaltyRule?.enabled ?? true;
    const lateThreshold = settings?.latePenaltyRule?.lateCountThreshold ?? 3;
    const penaltyPerThreshold = settings?.latePenaltyRule?.deductionDays ?? 0.5;

    // 2. Fetch all active or recently exited employees
    const employees = await Employee.find({
      $or: [
        { status: { $in: ["active", "probation"] } },
        { exitDate: { $gte: new Date(`${month}-01`) } },
      ],
    })
      .populate("department", "name")
      .populate("designation", "title")
      .lean();

    const unpaidLeaveType = await LeaveType.findOne({ name: "unpaid" }).lean();
    const unpaidTypeIdStr = unpaidLeaveType?._id.toString();

    const items = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalTax = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const basic = emp.salaryStructure?.basic || 0;
      const hra = emp.salaryStructure?.hra || Math.round(basic * 0.4);
      const medical = emp.salaryStructure?.medical || Math.round(basic * 0.1);
      const gross = emp.salaryStructure?.gross || Math.round(basic * 1.5);

      const perDayRate = Math.round(gross / workingDaysInMonth);

      // Check joining and exit dates for proration
      let effectiveWorkingDays = workingDaysInMonth;
      const joinDate = new Date(emp.joiningDate);
      const monthStart = new Date(`${month}-01`);
      const [y, m] = month.split("-").map(Number);
      const monthEnd = new Date(y, m, 0);

      if (joinDate > monthStart && joinDate <= monthEnd) {
        // Prorate joiner
        const joinDateStr = joinDate.toISOString().split("T")[0];
        const monthEndStr = monthEnd.toISOString().split("T")[0];
        effectiveWorkingDays = await calculateWorkingDays(joinDateStr, monthEndStr);
      }

      // Query attendance records for the month
      const monthRegex = new RegExp(`^${month}`);
      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $regex: monthRegex },
      }).lean();

      let presentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let missingCheckoutCount = 0;

      for (const att of attendanceRecords) {
        if (att.status === "present") presentCount++;
        else if (att.status === "late") lateCount++;
        else if (att.status === "half_day") halfDayCount++;
        else if (att.status === "missing_checkout") missingCheckoutCount++;
      }

      // Check approved leaves for the month
      const leaves = await LeaveRequest.find({
        employee: emp._id,
        status: "approved",
        startDate: { $regex: monthRegex },
      }).lean();

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const lv of leaves) {
        if (unpaidTypeIdStr && lv.leaveType.toString() === unpaidTypeIdStr) {
          unpaidLeaveDays += lv.workingDays;
        } else {
          paidLeaveDays += lv.workingDays;
        }
      }

      // Calculate absent days: expected working days - (present + late + missing_checkout + half_day + leaves)
      const recordedWorkingDays =
        presentCount + lateCount + halfDayCount + missingCheckoutCount + paidLeaveDays + unpaidLeaveDays;
      const absentDays = Math.max(0, effectiveWorkingDays - recordedWorkingDays);

      // Late penalty: 3 lates = 0.5 day deduction
      let latePenaltyDays = 0;
      if (latePenaltyEnabled && lateCount >= lateThreshold) {
        const penaltyMultiplier = Math.floor(lateCount / lateThreshold);
        latePenaltyDays = penaltyMultiplier * penaltyPerThreshold;
      }

      // Total deduction calculation
      // Deduct: absent days + unpaid leave + 0.5 * half days + late penalty days
      const totalDeductionDays = absentDays + unpaidLeaveDays + 0.5 * halfDayCount + latePenaltyDays;
      const deductions = Math.round(totalDeductionDays * perDayRate);

      // Prorated gross if joined late
      const proratedDays = workingDaysInMonth - effectiveWorkingDays;
      const proratedDeduction = proratedDays > 0 ? Math.round(proratedDays * perDayRate) : 0;
      const finalDeductions = deductions + proratedDeduction;

      // Tax calculation on annual gross
      const taxResult = calculateTax(gross);
      const monthlyTax = taxResult.monthlyTax;

      // Net Pay = Gross - Deductions - Tax
      const netPay = Math.max(0, gross - finalDeductions - monthlyTax);

      items.push({
        employee: emp._id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || "General",
        designation: emp.designation?.title || "Staff",
        basicSalary: basic,
        hra,
        medical,
        grossSalary: gross,
        workingDaysInMonth,
        perDayRate,
        absentDays,
        halfDays: halfDayCount,
        unpaidLeaveDays,
        lateDays: lateCount,
        latePenaltyDays,
        proratedDays,
        deductions: finalDeductions,
        annualGross: taxResult.annualGross,
        annualTax: taxResult.annualTax,
        monthlyTax,
        netPay,
      });

      totalGross += gross;
      totalDeductions += finalDeductions;
      totalTax += monthlyTax;
      totalNet += netPay;
    }

    if (existingRun) {
      existingRun.totalEmployees = items.length;
      existingRun.totalWorkingDays = workingDaysInMonth;
      existingRun.totalGross = totalGross;
      existingRun.totalDeductions = totalDeductions;
      existingRun.totalTax = totalTax;
      existingRun.totalNet = totalNet;
      existingRun.items = items;
      existingRun.preparedBy = req.user.userId;
      await existingRun.save();
    } else {
      existingRun = await PayrollRun.create({
        month,
        totalEmployees: items.length,
        totalWorkingDays: workingDaysInMonth,
        totalGross,
        totalDeductions,
        totalTax,
        totalNet,
        status: "draft",
        preparedBy: req.user.userId,
        items,
      });
    }

    await logAudit({
      req,
      action: "CREATE_PAYROLL_DRAFT",
      entity: "PayrollRun",
      entityId: existingRun._id,
      after: { month, totalEmployees: items.length, totalNet },
    });

    return res.status(201).json({
      message: `Payroll draft for ${month} generated successfully.`,
      payrollRun: existingRun,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. Get All Payroll Runs
export const getPayrollRuns = async (req, res) => {
  try {
    const runs = await PayrollRun.find()
      .populate("preparedBy", "email role")
      .populate("finalizedBy", "email role")
      .sort({ month: -1 })
      .lean();

    return res.json({ runs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. Get Single Payroll Run Details
export const getPayrollRunById = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id)
      .populate("preparedBy", "email role")
      .populate("finalizedBy", "email role")
      .lean();

    if (!run) return res.status(404).json({ message: "Payroll run not found." });

    return res.json({ run });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 4. Finalize Payroll Run (Admin ONLY - Locks the run)
export const finalizePayrollRun = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id);
    if (!run) return res.status(404).json({ message: "Payroll run not found." });

    if (run.status === "finalized") {
      return res.status(400).json({ message: "Payroll run is already finalized and locked." });
    }

    run.status = "finalized";
    run.finalizedBy = req.user.userId;
    run.finalizedAt = new Date();
    await run.save();

    // Create notifications for all employees in the run
    for (const item of run.items) {
      const emp = await Employee.findById(item.employee).select("user");
      if (emp?.user) {
        await Notification.create({
          user: emp.user,
          title: `Payslip Available for ${run.month}`,
          message: `Your payslip for ${run.month} is now available. Net pay: PKR ${item.netPay.toLocaleString()}`,
          type: "payroll",
        });
      }
    }

    await logAudit({
      req,
      action: "FINALIZE_PAYROLL",
      entity: "PayrollRun",
      entityId: run._id,
      after: { month: run.month, totalNet: run.totalNet, finalizedAt: run.finalizedAt },
    });

    return res.json({
      message: `Payroll run for ${run.month} finalized and locked successfully.`,
      run,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 5. Get Employee's Own Payslips (Employee self-service)
export const getMyPayslips = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) return res.status(400).json({ message: "No employee profile found." });

    const finalizedRuns = await PayrollRun.find({
      status: "finalized",
      "items.employee": employeeId,
    })
      .sort({ month: -1 })
      .lean();

    const payslips = finalizedRuns
      .map((run) => {
        const item = run.items.find((it) => it.employee.toString() === employeeId.toString());
        return item
          ? {
              payrollRunId: run._id,
              month: run.month,
              finalizedAt: run.finalizedAt,
              ...item,
            }
          : null;
      })
      .filter(Boolean);

    return res.json({ payslips });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 6. Download Payslip PDF
export const downloadPayslipPDF = async (req, res) => {
  try {
    const { id, employeeId } = req.params;

    // RBAC Scope Check: Employee can only download their own payslip
    if (req.user.role === "Employee" && req.user.employeeId !== employeeId) {
      return res.status(403).json({ message: "Forbidden: Cannot download another employee's payslip." });
    }

    const run = await PayrollRun.findById(id).lean();
    if (!run) return res.status(404).json({ message: "Payroll run not found." });

    const item = run.items.find((it) => it.employee.toString() === employeeId);
    if (!item) return res.status(404).json({ message: "Payslip item not found for this employee." });

    const settings = await CompanySetting.findOne().lean();
    const companyName = settings?.companyName || "HCM Lite";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Payslip_${item.employeeCode}_${run.month}.pdf"`
    );

    generatePayslipPDF(item, run.month, companyName, res);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
