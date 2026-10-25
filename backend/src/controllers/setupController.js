// controllers/setupController.js
import CompanySetting from "../models/CompanySetting.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";
import LeaveType from "../models/LeaveType.js";
import PublicHoliday from "../models/PublicHoliday.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Announcement from "../models/Announcement.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { logAudit } from "../utils/audit.js";
import { computeSalaryStructure } from "./employeeController.js";
import { getTodayDateStr } from "./attendanceController.js";

// Check if first-run setup is needed
export const getSetupStatus = async (req, res) => {
  try {
    const company = await CompanySetting.findOne().lean();
    const adminCount = await User.countDocuments({ role: "Admin" });

    const isSetup = Boolean(company && adminCount > 0);
    return res.json({
      isSetup,
      companyName: company?.companyName || null,
      officeStartTime: company?.officeStartTime || "09:00",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// First-run initialization
export const initializeSetup = async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "System is already initialized." });
    }

    const {
      companyName = "Saylani Tech Solutions",
      adminEmail,
      adminPassword,
      officeStartTime = "09:00",
      graceTimeMinutes = 15,
      weekendDays = ["Saturday", "Sunday"],
      latitude = 24.8607,
      longitude = 67.0011,
      radiusMeters = 150,
      officeAddress = "Zaitoon Ashraf IT Park, Karachi",
    } = req.body;

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ message: "Admin email and password are required." });
    }

    // 1. Create or update CompanySetting
    let company = await CompanySetting.findOne();
    if (!company) {
      company = await CompanySetting.create({
        companyName,
        officeStartTime,
        graceTimeMinutes: Number(graceTimeMinutes),
        halfDayThresholdHours: 5,
        weekendDays,
        officeLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          address: officeAddress,
        },
      });
    }

    // 2. Create default departments if none
    const deptCount = await Department.countDocuments();
    let engDept, hrDept;
    if (deptCount === 0) {
      engDept = await Department.create({ name: "Engineering", code: "ENG", description: "Product & Engineering" });
      hrDept = await Department.create({ name: "Human Resources", code: "HR", description: "People Operations" });
      await Department.create({ name: "Operations", code: "OPS", description: "Business Operations" });
      await Department.create({ name: "Finance", code: "FIN", description: "Accounts and Payroll" });
    } else {
      engDept = await Department.findOne({ name: "Engineering" });
      hrDept = await Department.findOne({ name: "Human Resources" });
    }

    // 3. Create default designations if none
    const desigCount = await Designation.countDocuments();
    if (desigCount === 0) {
      if (engDept) {
        await Designation.create({ title: "Software Engineer", department: engDept._id });
        await Designation.create({ title: "Tech Lead", department: engDept._id });
      }
      if (hrDept) {
        await Designation.create({ title: "HR Officer", department: hrDept._id });
        await Designation.create({ title: "HR Manager", department: hrDept._id });
      }
    }

    // 4. Create default Leave Types according to Section 3:
    // Quotas: annual 14, sick 8, casual 10; unpaid unlimited
    const leaveTypeCount = await LeaveType.countDocuments();
    if (leaveTypeCount === 0) {
      await LeaveType.create([
        { name: "annual", displayName: "Annual Leave", yearlyQuota: 14, isPaid: true },
        { name: "sick", displayName: "Sick Leave", yearlyQuota: 8, isPaid: true },
        { name: "casual", displayName: "Casual Leave", yearlyQuota: 10, isPaid: true },
        { name: "unpaid", displayName: "Unpaid Leave", yearlyQuota: 0, isPaid: false },
      ]);
    }

    // 5. Create default public holidays for 2026 if none
    const holidayCount = await PublicHoliday.countDocuments();
    if (holidayCount === 0) {
      await PublicHoliday.create([
        { name: "Labour Day", date: "2026-05-01", description: "International Workers Day" },
        { name: "Independence Day", date: "2026-08-14", description: "Pakistan Independence Day" },
        { name: "Iqbal Day", date: "2026-11-09", description: "Allama Iqbal Birthday" },
        { name: "Quaid-e-Azam Day", date: "2026-12-25", description: "Quaid Day & Christmas" },
      ]);
    }

    // 6. Create Admin user
    const adminUser = await User.create({
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: "Admin",
      isActive: true,
      mustChangePassword: false,
    });

    const accessToken = generateAccessToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    await logAudit({
      actor: { id: adminUser._id, email: adminUser.email, role: "Admin" },
      action: "INITIAL_SETUP",
      entity: "CompanySetting",
      entityId: company._id,
      after: { companyName, adminEmail },
    });

    return res.status(201).json({
      message: "First-run setup completed successfully.",
      accessToken,
      refreshToken,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        mustChangePassword: false,
      },
      company,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get Company Settings (Admin, HR)
export const getCompanySettings = async (req, res) => {
  try {
    const settings = await CompanySetting.findOne().lean();
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update Company Settings (Admin only)
export const updateCompanySettings = async (req, res) => {
  try {
    const before = await CompanySetting.findOne().lean();
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = new CompanySetting();
    }

    const {
      companyName,
      officeStartTime,
      graceTimeMinutes,
      halfDayThresholdHours,
      weekendDays,
      officeLocation,
      latePenaltyRule,
    } = req.body;

    if (companyName) settings.companyName = companyName;
    if (officeStartTime) settings.officeStartTime = officeStartTime;
    if (graceTimeMinutes !== undefined) settings.graceTimeMinutes = Number(graceTimeMinutes);
    if (halfDayThresholdHours !== undefined) settings.halfDayThresholdHours = Number(halfDayThresholdHours);
    if (weekendDays) settings.weekendDays = weekendDays;
    if (officeLocation) {
      settings.officeLocation = {
        ...settings.officeLocation,
        ...officeLocation,
      };
    }
    if (latePenaltyRule) {
      settings.latePenaltyRule = {
        ...settings.latePenaltyRule,
        ...latePenaltyRule,
      };
    }

    await settings.save();

    await logAudit({
      req,
      action: "UPDATE_COMPANY_SETTINGS",
      entity: "CompanySetting",
      entityId: settings._id,
      before,
      after: settings.toObject(),
    });

    return res.json({ message: "Settings updated successfully", settings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Departments ---
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    return res.json({ departments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) return res.status(400).json({ message: "Department name is required." });

    const exists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (exists) return res.status(400).json({ message: "Department already exists." });

    const dept = await Department.create({ name, code, description });

    await logAudit({
      req,
      action: "CREATE_DEPARTMENT",
      entity: "Department",
      entityId: dept._id,
      after: dept.toObject(),
    });

    return res.status(201).json({ department: dept });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found." });

    await Department.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: "DELETE_DEPARTMENT",
      entity: "Department",
      entityId: req.params.id,
      before: dept.toObject(),
    });

    return res.json({ message: "Department deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Designations ---
export const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find().populate("department", "name code").sort({ title: 1 }).lean();
    return res.json({ designations });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createDesignation = async (req, res) => {
  try {
    const { title, department, description } = req.body;
    if (!title) return res.status(400).json({ message: "Designation title is required." });

    const exists = await Designation.findOne({ title: { $regex: new RegExp(`^${title}$`, "i") } });
    if (exists) return res.status(400).json({ message: "Designation already exists." });

    const designation = await Designation.create({ title, department: department || null, description });

    await logAudit({
      req,
      action: "CREATE_DESIGNATION",
      entity: "Designation",
      entityId: designation._id,
      after: designation.toObject(),
    });

    return res.status(201).json({ designation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteDesignation = async (req, res) => {
  try {
    const item = await Designation.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Designation not found." });

    await Designation.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: "DELETE_DESIGNATION",
      entity: "Designation",
      entityId: req.params.id,
      before: item.toObject(),
    });

    return res.json({ message: "Designation deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Leave Types ---
export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ createdAt: 1 }).lean();
    return res.json({ leaveTypes });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const before = await LeaveType.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: "Leave type not found." });

    const { yearlyQuota, displayName, isPaid } = req.body;
    const updated = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { yearlyQuota: Number(yearlyQuota), displayName, isPaid },
      { new: true }
    );

    await logAudit({
      req,
      action: "UPDATE_LEAVE_TYPE",
      entity: "LeaveType",
      entityId: req.params.id,
      before,
      after: updated.toObject(),
    });

    return res.json({ leaveType: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- Public Holidays ---
export const getPublicHolidays = async (req, res) => {
  try {
    const holidays = await PublicHoliday.find().sort({ date: 1 }).lean();
    return res.json({ holidays });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createPublicHoliday = async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) return res.status(400).json({ message: "Holiday name and date are required." });

    const holiday = await PublicHoliday.create({ name, date, description });

    await logAudit({
      req,
      action: "CREATE_PUBLIC_HOLIDAY",
      entity: "PublicHoliday",
      entityId: holiday._id,
      after: holiday.toObject(),
    });

    return res.status(201).json({ holiday });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deletePublicHoliday = async (req, res) => {
  try {
    const holiday = await PublicHoliday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found." });

    await PublicHoliday.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: "DELETE_PUBLIC_HOLIDAY",
      entity: "PublicHoliday",
      entityId: req.params.id,
      before: holiday.toObject(),
    });

    return res.json({ message: "Holiday removed." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- User Management (Admin only) ---
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password")
      .populate("employeeId", "employeeCode firstName lastName email department designation")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Create Admin or HR account (Admin can create both roles)
export const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, role = "HR" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!["Admin", "HR"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'Admin' or 'HR'." });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: `A user with email '${email}' already exists.` });
    }

    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
      mustChangePassword: false,
    });

    await logAudit({
      req,
      action: role === "Admin" ? "CREATE_ADMIN_USER" : "CREATE_HR_USER",
      entity: "User",
      entityId: newUser._id,
      after: { email: newUser.email, role: newUser.role },
    });

    return res.status(201).json({
      message: `${role} account created successfully.`,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createHRUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const hrUser = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: "HR",
      isActive: true,
      mustChangePassword: false,
    });

    await logAudit({
      req,
      action: "CREATE_HR_USER",
      entity: "User",
      entityId: hrUser._id,
      after: { email: hrUser.email, role: "HR" },
    });

    return res.status(201).json({
      message: "HR account created successfully.",
      user: {
        id: hrUser._id,
        email: hrUser.email,
        role: hrUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role === "Admin" && user._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({ message: "Cannot deactivate your own Admin account." });
    }

    const before = user.toObject();
    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: user.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entity: "User",
      entityId: user._id,
      before,
      after: user.toObject(),
    });

    return res.json({ message: `User account ${user.isActive ? "activated" : "deactivated"}.`, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();

    await logAudit({
      req,
      action: "RESET_USER_PASSWORD",
      entity: "User",
      entityId: user._id,
      after: { email: user.email, mustChangePassword: true },
    });

    return res.json({ message: "Password reset successfully. User must change it upon next sign-in." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Seed demo data for quick Hackathon testing
export const seedDemoData = async (req, res) => {
  try {
    // 1. Company Setting
    let company = await CompanySetting.findOne();
    if (!company) {
      company = await CompanySetting.create({
        companyName: "Saylani Tech Solutions",
        officeStartTime: "09:00",
        graceTimeMinutes: 15,
        halfDayThresholdHours: 5,
        weekendDays: ["Saturday", "Sunday"],
        officeLocation: {
          latitude: 24.8607,
          longitude: 67.0011,
          radiusMeters: 150,
          address: "Zaitoon Ashraf IT Park, Karachi",
        },
      });
    }

    // 2. Departments
    let engDept = await Department.findOne({ name: "Engineering" });
    if (!engDept) engDept = await Department.create({ name: "Engineering", code: "ENG", description: "Software Engineering" });

    let hrDept = await Department.findOne({ name: "Human Resources" });
    if (!hrDept) hrDept = await Department.create({ name: "Human Resources", code: "HR", description: "People Operations" });

    let opsDept = await Department.findOne({ name: "Operations" });
    if (!opsDept) opsDept = await Department.create({ name: "Operations", code: "OPS", description: "Business Operations" });

    let finDept = await Department.findOne({ name: "Finance" });
    if (!finDept) finDept = await Department.create({ name: "Finance", code: "FIN", description: "Financial Accounting" });

    // 3. Designations
    let sdeDesig = await Designation.findOne({ title: "Software Engineer" });
    if (!sdeDesig) sdeDesig = await Designation.create({ title: "Software Engineer", department: engDept._id });

    let hrDesig = await Designation.findOne({ title: "HR Specialist" });
    if (!hrDesig) hrDesig = await Designation.create({ title: "HR Specialist", department: hrDept._id });

    let opsDesig = await Designation.findOne({ title: "Operations Lead" });
    if (!opsDesig) opsDesig = await Designation.create({ title: "Operations Lead", department: opsDept._id });

    // 4. Leave Types
    let annualLeave = await LeaveType.findOne({ name: "annual" });
    if (!annualLeave) annualLeave = await LeaveType.create({ name: "annual", displayName: "Annual Leave", yearlyQuota: 14, isPaid: true });

    let sickLeave = await LeaveType.findOne({ name: "sick" });
    if (!sickLeave) sickLeave = await LeaveType.create({ name: "sick", displayName: "Sick Leave", yearlyQuota: 8, isPaid: true });

    let casualLeave = await LeaveType.findOne({ name: "casual" });
    if (!casualLeave) casualLeave = await LeaveType.create({ name: "casual", displayName: "Casual Leave", yearlyQuota: 10, isPaid: true });

    let unpaidLeave = await LeaveType.findOne({ name: "unpaid" });
    if (!unpaidLeave) unpaidLeave = await LeaveType.create({ name: "unpaid", displayName: "Unpaid Leave", yearlyQuota: 0, isPaid: false });

    // 5. Public Holidays
    const holidayCount = await PublicHoliday.countDocuments();
    if (holidayCount === 0) {
      await PublicHoliday.create([
        { name: "Labour Day", date: "2026-05-01" },
        { name: "Independence Day", date: "2026-08-14" },
        { name: "Iqbal Day", date: "2026-11-09" },
        { name: "Quaid-e-Azam Day", date: "2026-12-25" },
      ]);
    }

    // 6. Admin Account
    let admin = await User.findOne({ email: "admin@saylani.com" });
    if (!admin) {
      admin = await User.create({
        email: "admin@saylani.com",
        password: "Admin@12345",
        role: "Admin",
        isActive: true,
        mustChangePassword: false,
      });
    }

    // 7. HR Account
    let hrUser = await User.findOne({ email: "hr@saylani.com" });
    if (!hrUser) {
      hrUser = await User.create({
        email: "hr@saylani.com",
        password: "Password@123",
        role: "HR",
        isActive: true,
        mustChangePassword: false,
      });
    }

    // 8. Sample Employees
    const demoEmployeesData = [
      {
        code: "EMP-001",
        firstName: "Ali",
        lastName: "Khan",
        email: "ali@saylani.com",
        phone: "+92 300 1234567",
        address: "Gulshan-e-Iqbal, Karachi",
        gender: "male",
        department: engDept._id,
        designation: sdeDesig._id,
        basic: 120000,
      },
      {
        code: "EMP-002",
        firstName: "Sara",
        lastName: "Ahmed",
        email: "sara@saylani.com",
        phone: "+92 301 7654321",
        address: "Clifton, Karachi",
        gender: "female",
        department: hrDept._id,
        designation: hrDesig._id,
        basic: 100000,
      },
      {
        code: "EMP-003",
        firstName: "Usman",
        lastName: "Tariq",
        email: "usman@saylani.com",
        phone: "+92 333 9876543",
        address: "PECHS, Karachi",
        gender: "male",
        department: opsDept._id,
        designation: opsDesig._id,
        basic: 110000,
      },
    ];

    const createdEmps = [];
    for (const d of demoEmployeesData) {
      let emp = await Employee.findOne({ email: d.email });
      if (!emp) {
        const sal = computeSalaryStructure(d.basic);
        emp = await Employee.create({
          employeeCode: d.code,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
          address: d.address,
          gender: d.gender,
          department: d.department,
          designation: d.designation,
          joiningDate: new Date("2026-01-15"),
          status: "active",
          salaryStructure: sal,
        });

        let empUser = await User.findOne({ email: d.email });
        if (!empUser) {
          empUser = await User.create({
            email: d.email,
            password: "Password@123",
            role: "Employee",
            employeeId: emp._id,
            isActive: true,
            mustChangePassword: false,
          });
        }
        emp.user = empUser._id;
        await emp.save();
      }
      createdEmps.push(emp);
    }

    // 9. Sample Attendance for today
    const todayStr = getTodayDateStr();
    if (createdEmps[0]) {
      const att1 = await Attendance.findOne({ employee: createdEmps[0]._id, date: todayStr });
      if (!att1) {
        const d = new Date();
        d.setHours(9, 5, 0, 0); // on time
        await Attendance.create({
          employee: createdEmps[0]._id,
          date: todayStr,
          checkIn: d,
          status: "present",
          source: "web",
        });
      }
    }

    if (createdEmps[1]) {
      const att2 = await Attendance.findOne({ employee: createdEmps[1]._id, date: todayStr });
      if (!att2) {
        const d = new Date();
        d.setHours(9, 35, 0, 0); // late after 09:15
        await Attendance.create({
          employee: createdEmps[1]._id,
          date: todayStr,
          checkIn: d,
          status: "late",
          source: "web",
        });
      }
    }

    // 10. Sample Announcement
    const annCount = await Announcement.countDocuments();
    if (annCount === 0) {
      await Announcement.create({
        title: "Welcome to HCM Lite!",
        message: "Welcome to the Saylani Hackathon HCM system. Check in, view payslips, and try our AI assistant.",
        priority: "high",
        targetRole: "All",
        author: admin._id,
        authorName: "Administrator",
      });
    }

    return res.json({
      message: "Demo dataset initialized successfully!",
      accounts: {
        admin: { email: "admin@saylani.com", password: "Admin@12345", role: "Admin" },
        hr: { email: "hr@saylani.com", password: "Password@123", role: "HR" },
        employee: { email: "ali@saylani.com", password: "Password@123", role: "Employee" },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
