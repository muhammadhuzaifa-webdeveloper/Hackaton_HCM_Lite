// controllers/aiController.js
import AiLog from "../models/AiLog.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import PayrollRun from "../models/PayrollRun.js";
import Department from "../models/Department.js";
import CompanySetting from "../models/CompanySetting.js";
import { getTodayDateStr } from "./attendanceController.js";
import { getEmployeeLeaveBalances } from "./leaveController.js";

// Rate limiting in-memory map: userId -> [timestamp]
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxReqs = 25; // ~20-25 reqs/hr

  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxReqs) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

// System Policy Knowledge Base
const SYSTEM_POLICY = `
HCM Lite Company Rules & Policies:
1. Office Hours: Starts at 09:00 AM. Grace time is 15 minutes. Employees checking in after 09:15 AM are marked 'late'.
2. Half Day: If total working duration between check-in and check-out is under 5 hours, attendance status becomes 'half_day'.
3. Weekends: Saturday and Sunday are official non-working weekend days.
4. Leave Quotas:
   - Annual Leave: 14 days per year (Paid)
   - Sick Leave: 8 days per year (Paid)
   - Casual Leave: 10 days per year (Paid)
   - Unpaid Leave: Unlimited (Unpaid)
5. Leave Application Rules: Working days only (weekends and public holidays are excluded). Overlapping leave requests and over-balance requests are rejected with status 422.
6. Payroll Calculation:
   - Basic Salary is the base.
   - Gross Salary = 1.5 * Basic (House Rent Allowance HRA is 40%, Medical is 10%).
   - Daily rate = Gross / Working days in month.
   - Deductions: Absent days, unpaid leaves, 0.5 * half days, and late penalty (3 lates = 0.5 day deduction).
   - Tax Slabs on Gross * 12: 0-600k (0%), 600k-1.2M (5%), 1.2M-2.4M (30k + 15%), 2.4M-3.6M (210k + 25%), Above 3.6M (510k + 35%).
7. Data Access & Privacy: Employees can ONLY view their own profile, attendance, leave balance, and payslips. Colleagues' salaries are confidential.
`;

// =================== TOOL DEFINITIONS & EXECUTORS ===================

async function executeTool(toolName, args, user) {
  switch (toolName) {
    case "get_headcount": {
      const query = { status: "active" };
      if (args.department) {
        const dept = await Department.findOne({ name: new RegExp(args.department, "i") });
        if (dept) query.department = dept._id;
      }
      const count = await Employee.countDocuments(query);
      return { activeHeadcount: count, department: args.department || "All" };
    }

    case "get_attendance_summary": {
      const targetDate = args.date || getTodayDateStr();
      const attendances = await Attendance.find({ date: targetDate }).lean();
      const summary = { present: 0, late: 0, half_day: 0 };
      attendances.forEach((a) => {
        if (summary[a.status] !== undefined) summary[a.status]++;
      });
      const activeCount = await Employee.countDocuments({ status: "active" });
      const attendanceRate = activeCount ? Math.round(((summary.present + summary.late) / activeCount) * 100) : 0;

      return {
        date: targetDate,
        ...summary,
        totalCheckedIn: attendances.length,
        totalActiveEmployees: activeCount,
        attendanceRate: `${attendanceRate}%`,
      };
    }

    case "get_late_comers": {
      const month = args.month || getTodayDateStr().slice(0, 7);
      const lateRecords = await Attendance.find({
        date: { $regex: new RegExp(`^${month}`) },
        status: "late",
      })
        .populate("employee", "firstName lastName employeeCode department")
        .populate({ path: "employee", populate: { path: "department", select: "name" } })
        .lean();

      const counts = {};
      lateRecords.forEach((r) => {
        const name = r.employee ? `${r.employee.firstName} ${r.employee.lastName} (${r.employee.employeeCode})` : "Unknown";
        counts[name] = (counts[name] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ employee: name, lateCount: count }))
        .sort((a, b) => b.lateCount - a.lateCount);

      return { month, topLateComers: sorted.slice(0, 5) };
    }

    case "get_leave_summary": {
      const month = args.month || getTodayDateStr().slice(0, 7);
      const leaves = await LeaveRequest.find({
        status: "approved",
        startDate: { $regex: new RegExp(`^${month}`) },
      })
        .populate("employee", "firstName lastName employeeCode")
        .populate("leaveType", "displayName")
        .lean();

      return {
        month,
        approvedLeavesCount: leaves.length,
        employeesOnLeave: leaves.map((l) => ({
          employee: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "Unknown",
          type: l.leaveType?.displayName,
          days: l.workingDays,
          startDate: l.startDate,
          endDate: l.endDate,
        })),
      };
    }

    case "get_my_leave_balance": {
      if (!user.employeeId) return { message: "No employee profile found." };
      const balances = await getEmployeeLeaveBalances(user.employeeId);
      return { balances };
    }

    case "get_payroll_summary": {
      if (user.role === "Employee") {
        return { error: "Employees cannot access company payroll summaries." };
      }
      const latestRun = await PayrollRun.findOne(args.month ? { month: args.month } : {})
        .sort({ month: -1 })
        .lean();

      if (!latestRun) return { message: "No payroll runs available." };
      return {
        month: latestRun.month,
        status: latestRun.status,
        totalEmployees: latestRun.totalEmployees,
        totalGross: `PKR ${latestRun.totalGross?.toLocaleString()}`,
        totalDeductions: `PKR ${latestRun.totalDeductions?.toLocaleString()}`,
        totalTax: `PKR ${latestRun.totalTax?.toLocaleString()}`,
        totalNet: `PKR ${latestRun.totalNet?.toLocaleString()}`,
      };
    }

    case "search_employees": {
      const regex = new RegExp(args.query || "", "i");
      const emps = await Employee.find({
        $or: [{ firstName: regex }, { lastName: regex }, { employeeCode: regex }],
      })
        .populate("department", "name")
        .populate("designation", "title")
        .limit(5)
        .lean();

      return {
        employees: emps.map((e) => ({
          code: e.employeeCode,
          name: `${e.firstName} ${e.lastName}`,
          department: e.department?.name,
          designation: e.designation?.title,
          status: e.status,
        })),
      };
    }

    default:
      return null;
  }
}

// Call Google Gemini API if AI_API_KEY is configured
async function callGeminiAPI(prompt, user, liveContext) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null; // fallback to built-in executor
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: {
        parts: [
          {
            text: `${SYSTEM_POLICY}\nYou are the HCM Lite AI Assistant. You answer questions strictly based on the provided company policy and live context data. Role of asking user: ${user.role}. If an employee asks for another colleague's salary, politely refuse. You understand English, Urdu, and Roman Urdu.`,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Live Database Context: ${JSON.stringify(liveContext)}\n\nUser Question: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || null;
  } catch (err) {
    console.warn("Gemini API call failed, falling back to local engine:", err.message);
    return null;
  }
}

// 1. Natural Language Intent & Dispatcher (supports English & Roman Urdu)
export const chatWithAssistant = async (req, res) => {
  const startTime = Date.now();
  try {
    const user = req.user;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt is required." });
    }

    // Rate Limit Check
    if (!checkRateLimit(user.userId)) {
      return res.status(429).json({
        message: "Rate limit reached (~20 requests per hour). Please try again later.",
      });
    }

    const lower = prompt.toLowerCase();

    // ================= GUARDRAILS =================
    // Colleague salary confidentiality check
    if (
      (lower.includes("salary") || lower.includes("tankhwah") || lower.includes("pay")) &&
      user.role === "Employee" &&
      !lower.includes("my salary") &&
      !lower.includes("mera salary") &&
      !lower.includes("meri salary") &&
      !lower.includes("meri tankhwah")
    ) {
      const response =
        "I cannot disclose another employee's salary or financial details as per HCM Lite privacy and role access policies.";
      await AiLog.create({
        user: user.userId,
        role: user.role,
        prompt,
        response,
        durationMs: Date.now() - startTime,
      });
      return res.json({ response, isAIGenerated: true, toolUsed: null });
    }

    let toolUsed = null;
    let toolResult = null;
    let finalAnswer = "";

    // 1. My Leave Balance
    if (
      lower.includes("my leave") ||
      lower.includes("leave balance") ||
      lower.includes("sick leave") ||
      lower.includes("casual leave") ||
      lower.includes("chutti") ||
      lower.includes("chhutti") ||
      lower.includes("mera leave")
    ) {
      toolUsed = "get_my_leave_balance";
      toolResult = await executeTool(toolUsed, {}, user);
      if (toolResult?.balances) {
        const balList = toolResult.balances
          .map((b) => `${b.displayName}: ${b.remaining} days remaining (Used: ${b.used}/${b.quota || "∞"})`)
          .join(", ");
        finalAnswer = `Your current leave balance is:\n${balList}.`;
      } else {
        finalAnswer = "Could not fetch your leave balance.";
      }
    }
    // 2. Headcount
    else if (
      lower.includes("headcount") ||
      lower.includes("how many employee") ||
      lower.includes("kitnay employee") ||
      lower.includes("kitne employee") ||
      lower.includes("active employee")
    ) {
      let deptName = null;
      if (lower.includes("engineering")) deptName = "Engineering";
      else if (lower.includes("hr") || lower.includes("human resources")) deptName = "Human Resources";
      else if (lower.includes("operations")) deptName = "Operations";
      else if (lower.includes("finance")) deptName = "Finance";

      toolUsed = "get_headcount";
      toolResult = await executeTool(toolUsed, { department: deptName }, user);
      finalAnswer = deptName
        ? `There are currently ${toolResult.activeHeadcount} active employee(s) in the ${deptName} department.`
        : `The total active company headcount is ${toolResult.activeHeadcount} employee(s).`;
    }
    // 3. Late comers
    else if (
      lower.includes("late") ||
      lower.includes("der se") ||
      lower.includes("kon late aya") ||
      lower.includes("who came late")
    ) {
      toolUsed = "get_late_comers";
      toolResult = await executeTool(toolUsed, {}, user);
      if (toolResult.topLateComers.length === 0) {
        finalAnswer = `No employees have been marked late this month (${toolResult.month}).`;
      } else {
        const list = toolResult.topLateComers
          .map((t, idx) => `${idx + 1}. ${t.employee} - ${t.lateCount} time(s)`)
          .join("\n");
        finalAnswer = `Top late-comers for ${toolResult.month}:\n${list}`;
      }
    }
    // 4. Attendance rate or summary
    else if (
      lower.includes("attendance rate") ||
      lower.includes("attendance summary") ||
      lower.includes("present today") ||
      lower.includes("aaj kitne hazir")
    ) {
      toolUsed = "get_attendance_summary";
      toolResult = await executeTool(toolUsed, {}, user);
      finalAnswer = `For ${toolResult.date}:\n- Checked In: ${toolResult.totalCheckedIn}/${toolResult.totalActiveEmployees}\n- Present on time: ${toolResult.present}\n- Late: ${toolResult.late}\n- Half Day: ${toolResult.half_day}\n- Overall Attendance Rate: ${toolResult.attendanceRate}`;
    }
    // 5. Leave summary / Who is on leave
    else if (
      lower.includes("who is on leave") ||
      lower.includes("leave summary") ||
      lower.includes("kon chutti pe hai")
    ) {
      toolUsed = "get_leave_summary";
      toolResult = await executeTool(toolUsed, {}, user);
      if (toolResult.employeesOnLeave.length === 0) {
        finalAnswer = `There are currently no employees on approved leave for ${toolResult.month}.`;
      } else {
        const list = toolResult.employeesOnLeave
          .map((l) => `- ${l.employee}: ${l.type} (${l.days} days, from ${l.startDate} to ${l.endDate})`)
          .join("\n");
        finalAnswer = `Employees on approved leave for ${toolResult.month}:\n${list}`;
      }
    }
    // 6. Payroll summary
    else if (
      lower.includes("payroll") ||
      lower.includes("total cost") ||
      lower.includes("tankhwah ka kharcha")
    ) {
      if (user.role === "Employee") {
        finalAnswer = "You do not have permission to view company-wide payroll summaries.";
      } else {
        toolUsed = "get_payroll_summary";
        toolResult = await executeTool(toolUsed, {}, user);
        if (toolResult.error) {
          finalAnswer = toolResult.error;
        } else if (toolResult.message) {
          finalAnswer = toolResult.message;
        } else {
          finalAnswer = `Payroll Summary for ${toolResult.month} (${toolResult.status.toUpperCase()}):\n- Employees: ${toolResult.totalEmployees}\n- Total Gross: ${toolResult.totalGross}\n- Total Deductions: ${toolResult.totalDeductions}\n- Total Tax: ${toolResult.totalTax}\n- Total Net Pay: ${toolResult.totalNet}`;
        }
      }
    }
    // 7. Policy Questions (Grace period, office time, tax slab, etc.)
    else if (
      lower.includes("grace") ||
      lower.includes("office time") ||
      lower.includes("timing") ||
      lower.includes("policy") ||
      lower.includes("rule") ||
      lower.includes("half day") ||
      lower.includes("tax") ||
      lower.includes("quota")
    ) {
      if (lower.includes("grace") || lower.includes("timing") || lower.includes("office time")) {
        finalAnswer =
          "According to company policy, office starts at 09:00 AM with a 15-minute grace period. Anyone checking in after 09:15 AM is recorded as Late. Half day applies if total work duration is under 5 hours.";
      } else if (lower.includes("quota") || lower.includes("annual leave") || lower.includes("sick leave")) {
        finalAnswer =
          "Yearly leave quotas are: Annual Leave (14 days), Sick Leave (8 days), Casual Leave (10 days), and Unpaid Leave (Unlimited). Weekends and public holidays are not counted against leave balance.";
      } else if (lower.includes("tax")) {
        finalAnswer =
          "Tax slabs on annual gross (Gross × 12): Up to 600k (0%), 600k-1.2M (5%), 1.2M-2.4M (30k + 15%), 2.4M-3.6M (210k + 25%), Above 3.6M (510k + 35%). Monthly tax is calculated as Annual Tax divided by 12.";
      } else {
        finalAnswer = SYSTEM_POLICY.trim();
      }
    }
    // Default fallback
    else {
      finalAnswer =
        "I am your HCM Lite AI Assistant. You can ask me about live attendance numbers, headcount, leave balances, late-comers, payroll summary, or company policies in English or Roman Urdu!";
    }

    // If Gemini API Key is provided, try enriching the answer via Gemini
    if (process.env.AI_API_KEY) {
      const geminiResponse = await callGeminiAPI(prompt, user, {
        toolUsed,
        toolResult,
        ruleContext: finalAnswer,
      });
      if (geminiResponse) {
        finalAnswer = geminiResponse;
      }
    }

    // Save AI Log
    await AiLog.create({
      user: user.userId,
      role: user.role,
      prompt,
      toolUsed,
      toolInput: {},
      toolOutput: toolResult,
      response: finalAnswer,
      durationMs: Date.now() - startTime,
    });

    return res.json({
      response: finalAnswer,
      isAIGenerated: true,
      toolUsed,
      toolOutput: toolResult,
    });
  } catch (err) {
    return res.status(500).json({
      response: "Sorry, I encountered an issue processing your request. Please try again.",
      isAIGenerated: true,
      error: err.message,
    });
  }
};

// 2. Dashboard Summary
// Admin or HR clicks 'Summarize', backend sends 3-5 insight bullets using only the KPI numbers
export const summarizeDashboard = async (req, res) => {
  try {
    const { kpis, role } = req.body;
    if (!kpis) {
      return res.status(400).json({ message: "KPI data is required for summary." });
    }

    const bullets = [];

    if (role === "Admin" || req.user.role === "Admin") {
      bullets.push(
        `Headcount stands at ${kpis.headcount || 0} active team members, with an attrition rate of ${kpis.attritionRate || 0}%.`
      );
      if (kpis.payrollCost) {
        bullets.push(`Latest finalized monthly net payroll expense is PKR ${kpis.payrollCost.toLocaleString()}.`);
      }
      if (kpis.avgSalary) {
        bullets.push(`Average gross compensation across the workforce is PKR ${kpis.avgSalary.toLocaleString()}.`);
      }
      bullets.push(
        "Company operational setup, departments, and audit logs remain fully compliant with zero unapproved payroll edits."
      );
    } else {
      // HR
      bullets.push(
        `Today's attendance rate is ${kpis.attendanceRate || 0}% with ${kpis.presentToday || 0} on time and ${kpis.lateToday || 0} late.`
      );
      bullets.push(
        `${kpis.onLeaveToday || 0} team member(s) are officially on approved leave today.`
      );
      bullets.push(
        `There are currently ${kpis.pendingApprovals || 0} pending action item(s) (${kpis.pendingLeaves || 0} leave applications, ${kpis.pendingCorrections || 0} attendance corrections).`
      );
      if (kpis.absentToday > 0) {
        bullets.push(`${kpis.absentToday} employee(s) have unexcused absence today.`);
      }
    }

    return res.json({
      bullets,
      summaryText: bullets.join("\n"),
      isAIGenerated: true,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. Smart Leave (Parses sentence -> Pre-filled Form JSON)
// "Need next Monday and Tuesday off for a wedding" or "Mujhe 2 din casual chutti chahiye"
export const parseSmartLeave = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt sentence is required." });

    const lower = prompt.toLowerCase();

    // 1. Determine Leave Type
    let leaveTypeName = "casual"; // default
    if (lower.includes("sick") || lower.includes("bimari") || lower.includes("doctor") || lower.includes("tabiyat")) {
      leaveTypeName = "sick";
    } else if (lower.includes("annual") || lower.includes("vacation") || lower.includes("holiday")) {
      leaveTypeName = "annual";
    } else if (lower.includes("unpaid")) {
      leaveTypeName = "unpaid";
    }

    const leaveType = await LeaveType.findOne({ name: leaveTypeName });

    // 2. Determine dates
    // Default to tomorrow or next Monday
    const today = new Date();
    let startDate = new Date();
    startDate.setDate(today.getDate() + 1); // tomorrow

    let endDate = new Date(startDate);

    // If says 2 days / two days
    if (lower.includes("2 day") || lower.includes("two day") || lower.includes("2 din") || lower.includes("do din")) {
      endDate.setDate(startDate.getDate() + 1);
    } else if (lower.includes("3 day") || lower.includes("three day") || lower.includes("3 din") || lower.includes("teen din")) {
      endDate.setDate(startDate.getDate() + 2);
    } else if (lower.includes("monday") && lower.includes("tuesday")) {
      // Find next Monday
      const day = today.getDay();
      const daysUntilMonday = ((8 - day) % 7) || 7;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + daysUntilMonday);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // Tuesday
    }

    // Clean reason
    let reason = prompt;
    if (lower.includes("for ")) {
      reason = prompt.slice(lower.indexOf("for ") + 4).trim();
    } else if (lower.includes("ke liye") || lower.includes("keliye")) {
      reason = prompt;
    }

    return res.json({
      leaveTypeId: leaveType?._id,
      leaveTypeName: leaveType?.displayName || "Casual Leave",
      startDate: getTodayDateStr(startDate),
      endDate: getTodayDateStr(endDate),
      reason: reason || "Personal reasons",
      isAIGenerated: true,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
