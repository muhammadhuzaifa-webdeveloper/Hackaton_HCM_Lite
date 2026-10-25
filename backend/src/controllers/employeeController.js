// controllers/employeeController.js
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import PayrollRun from "../models/PayrollRun.js";
import { logAudit } from "../utils/audit.js";

// Helper: Calculate Gross Salary
// Formula: Gross = 1.5 * basic (HRA 40%, Medical 10%)
export function computeSalaryStructure(basicSalary) {
  const basic = Number(basicSalary) || 0;
  const hra = Math.round(basic * 0.4);
  const medical = Math.round(basic * 0.1);
  const gross = Math.round(basic * 1.5);
  return { basic, hra, medical, gross };
}

// 1. Get Employee Directory with search, filters, pagination
export const getEmployees = async (req, res) => {
  try {
    const { search, department, designation, status, page = 1, limit = 50 } = req.query;

    const query = {};

    // If Employee role, restrict to own record
    if (req.user.role === "Employee") {
      query._id = req.user.employeeId;
    } else {
      if (department) query.department = department;
      if (designation) query.designation = designation;
      if (status) query.status = status;

      if (search) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [
          { employeeCode: regex },
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate("department", "name code")
        .populate("designation", "title")
        .sort({ employeeCode: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Employee.countDocuments(query),
    ]);

    return res.json({
      employees,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. Register Employee (HR creates employee + user login)
export const registerEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      address,
      gender,
      department,
      designation,
      joiningDate,
      basicSalary,
      temporaryPassword = "Password@123",
      role = "Employee",
    } = req.body;

    if (!employeeCode || !firstName || !lastName || !email || !department || !designation || !basicSalary) {
      return res.status(400).json({ message: "Required employee details or basic salary are missing." });
    }

    // Check duplicate code or email
    const existingCode = await Employee.findOne({ employeeCode: employeeCode.trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: `Employee code '${employeeCode}' is already in use.` });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ message: `Email '${email}' is already registered.` });
    }

    // Compute salary structure: Gross = 1.5 * basic
    const salaryStructure = computeSalaryStructure(basicSalary);

    // Create Employee record
    const employee = await Employee.create({
      employeeCode: employeeCode.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      gender: gender || "other",
      department,
      designation,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: "active",
      salaryStructure,
    });

    // Create linked User account with temporary password
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      role: role === "HR" ? "HR" : "Employee",
      employeeId: employee._id,
      isActive: true,
      mustChangePassword: true, // change on first sign-in
    });

    employee.user = user._id;
    await employee.save();

    await logAudit({
      req,
      action: "REGISTER_EMPLOYEE",
      entity: "Employee",
      entityId: employee._id,
      after: employee.toObject(),
    });

    return res.status(201).json({
      message: "Employee registered successfully and user account created.",
      employee,
      temporaryPassword,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. Employee 360 View
export const getEmployee360 = async (req, res) => {
  try {
    const { id } = req.params;

    // RBAC: Employee can only see own 360 profile
    if (req.user.role === "Employee" && req.user.employeeId !== id) {
      return res.status(403).json({ message: "Forbidden: Cannot access other employee profile." });
    }

    const employee = await Employee.findById(id)
      .populate("department", "name code")
      .populate("designation", "title")
      .lean();

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // If requester is Employee, redact sensitive colleagues details (already scoped to self)
    const [attendances, leaves, payrollRuns] = await Promise.all([
      Attendance.find({ employee: id }).sort({ date: -1 }).limit(30).lean(),
      LeaveRequest.find({ employee: id }).populate("leaveType", "displayName name").sort({ createdAt: -1 }).limit(20).lean(),
      PayrollRun.find({ "items.employee": id, status: "finalized" })
        .sort({ month: -1 })
        .limit(12)
        .lean(),
    ]);

    // Extract employee's payslip items from finalized runs
    const payslips = payrollRuns
      .map((run) => {
        const item = run.items.find((it) => it.employee.toString() === id);
        return item ? { ...item, month: run.month, payrollRunId: run._id } : null;
      })
      .filter(Boolean);

    return res.json({
      employee,
      recentAttendance: attendances,
      leaveHistory: leaves,
      payslips,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 4. Update Employee Details (HR / Admin)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await Employee.findById(id).lean();
    if (!before) return res.status(404).json({ message: "Employee not found." });

    const {
      firstName,
      lastName,
      phone,
      address,
      gender,
      department,
      designation,
      joiningDate,
      status,
      exitDate,
      basicSalary,
    } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (gender) updates.gender = gender;
    if (department) updates.department = department;
    if (designation) updates.designation = designation;
    if (joiningDate) updates.joiningDate = new Date(joiningDate);
    if (status) updates.status = status;
    if (exitDate) updates.exitDate = new Date(exitDate);

    if (basicSalary) {
      updates.salaryStructure = computeSalaryStructure(basicSalary);
    }

    const updated = await Employee.findByIdAndUpdate(id, updates, { new: true })
      .populate("department", "name code")
      .populate("designation", "title");

    await logAudit({
      req,
      action: "UPDATE_EMPLOYEE",
      entity: "Employee",
      entityId: id,
      before,
      after: updated.toObject(),
    });

    return res.json({ message: "Employee updated successfully.", employee: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 5. Employee Self-Service: Update phone & address
export const updateSelfProfile = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "No employee record associated with your user." });
    }

    const { phone, address } = req.body;
    const before = await Employee.findById(employeeId).lean();
    if (!before) return res.status(404).json({ message: "Employee not found." });

    const updated = await Employee.findByIdAndUpdate(
      employeeId,
      { phone: phone || "", address: address || "" },
      { new: true }
    );

    await logAudit({
      req,
      action: "UPDATE_SELF_PROFILE",
      entity: "Employee",
      entityId: employeeId,
      before,
      after: updated.toObject(),
    });

    return res.json({ message: "Profile updated successfully.", employee: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 6. CSV Dry Run & Import
// Checks required fields, unique code/email, valid email, known dept, ISO date, salary > 0
export const csvImportDryRun = async (req, res) => {
  try {
    const { rows } = req.body; // Array of row objects from parsed CSV
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data rows provided for CSV import." });
    }

    const departments = await Department.find().lean();
    const deptMap = new Map(departments.map((d) => [d.name.toLowerCase().trim(), d._id]));

    const existingCodes = new Set((await Employee.find().select("employeeCode").lean()).map((e) => e.employeeCode));
    const existingEmails = new Set((await User.find().select("email").lean()).map((u) => u.email));

    const errors = [];
    const validRows = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const code = String(row.employeeCode || "").trim().toUpperCase();
      const email = String(row.email || "").trim().toLowerCase();
      const deptName = String(row.department || "").trim().toLowerCase();
      const basic = Number(row.basicSalary);
      const joining = String(row.joiningDate || "").trim();

      if (!code) errors.push({ row: rowNum, field: "employeeCode", reason: "Employee code is required." });
      else if (existingCodes.has(code)) errors.push({ row: rowNum, field: "employeeCode", reason: `Code '${code}' already exists.` });

      if (!row.firstName) errors.push({ row: rowNum, field: "firstName", reason: "First name is required." });
      if (!row.lastName) errors.push({ row: rowNum, field: "lastName", reason: "Last name is required." });

      if (!email || !emailRegex.test(email)) errors.push({ row: rowNum, field: "email", reason: "Valid email is required." });
      else if (existingEmails.has(email)) errors.push({ row: rowNum, field: "email", reason: `Email '${email}' is already registered.` });

      if (!deptMap.has(deptName)) errors.push({ row: rowNum, field: "department", reason: `Unknown department '${row.department}'.` });

      if (isNaN(basic) || basic <= 0) errors.push({ row: rowNum, field: "basicSalary", reason: "Salary must be a positive number." });

      if (!joining || isNaN(Date.parse(joining))) errors.push({ row: rowNum, field: "joiningDate", reason: "Valid ISO date (YYYY-MM-DD) is required." });

      if (!errors.some((e) => e.row === rowNum)) {
        validRows.push({
          ...row,
          employeeCode: code,
          email,
          departmentId: deptMap.get(deptName),
          basicSalary: basic,
        });
      }
    });

    return res.json({
      valid: errors.length === 0,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      canCommit: errors.length === 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 7. Commit CSV Import
export const csvImportCommit = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data to import." });
    }

    const defaultDesig = await Designation.findOne();
    const createdEmployees = [];

    for (const row of rows) {
      const salaryStructure = computeSalaryStructure(row.basicSalary);
      const employee = await Employee.create({
        employeeCode: row.employeeCode.toUpperCase(),
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email.toLowerCase(),
        phone: row.phone || "",
        address: row.address || "",
        gender: row.gender || "other",
        department: row.departmentId,
        designation: defaultDesig?._id,
        joiningDate: new Date(row.joiningDate),
        status: "active",
        salaryStructure,
      });

      const user = await User.create({
        email: row.email.toLowerCase(),
        password: "Password@123",
        role: "Employee",
        employeeId: employee._id,
        isActive: true,
        mustChangePassword: true,
      });

      employee.user = user._id;
      await employee.save();
      createdEmployees.push(employee);
    }

    await logAudit({
      req,
      action: "CSV_IMPORT_EMPLOYEES",
      entity: "Employee",
      after: { count: createdEmployees.length },
    });

    return res.status(201).json({
      message: `Successfully imported ${createdEmployees.length} employees.`,
      count: createdEmployees.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 8. CSV Export (returns array of clean data for client download)
export const csvExportEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("department", "name")
      .populate("designation", "title")
      .sort({ employeeCode: 1 })
      .lean();

    const data = employees.map((e) => ({
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      phone: e.phone || "",
      address: e.address || "",
      gender: e.gender,
      department: e.department?.name || "",
      designation: e.designation?.title || "",
      joiningDate: e.joiningDate ? new Date(e.joiningDate).toISOString().split("T")[0] : "",
      status: e.status,
      basicSalary: e.salaryStructure?.basic || 0,
      grossSalary: e.salaryStructure?.gross || 0,
    }));

    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 9. Confirm / Approve Employee (Admin or HR confirms new addition)
export const confirmEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found." });

    employee.status = "active";
    await employee.save();

    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, { isActive: true });
    }

    await logAudit({
      req,
      action: "CONFIRM_EMPLOYEE",
      entity: "Employee",
      entityId: employee._id,
      after: { employeeCode: employee.employeeCode, status: "active" },
    });

    return res.json({
      message: `Employee ${employee.employeeCode} (${employee.firstName} ${employee.lastName}) confirmed & activated successfully!`,
      employee,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
