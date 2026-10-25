// controllers/authController.js
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";
import Notification from "../models/Notification.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { logAudit } from "../utils/audit.js";
import { computeSalaryStructure } from "./employeeController.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.isActive === false) {
      // Check if this is an employee waiting for approval
      if (user.employeeId) {
        const emp = await Employee.findById(user.employeeId).lean();
        if (emp?.status === "pending_approval") {
          return res.status(403).json({
            message: "Your employee account is pending confirmation by Admin or HR. Please wait for approval.",
          });
        }
      }
      return res.status(403).json({ message: "Account has been deactivated. Contact Admin." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    let employeeData = null;
    if (user.employeeId) {
      employeeData = await Employee.findById(user.employeeId)
        .populate("department", "name code")
        .populate("designation", "title")
        .lean();

      if (employeeData && employeeData.status === "pending_approval") {
        return res.status(403).json({
          message: "Your employee account is pending confirmation by Admin or HR. Please wait for approval.",
        });
      }
    }

    await logAudit({
      actor: { id: user._id, email: user.email, role: user.role },
      action: "USER_LOGIN",
      entity: "User",
      entityId: user._id,
      after: { email: user.email, role: user.role },
      req,
    });

    return res.json({
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mustChangePassword: user.mustChangePassword,
        employee: employeeData,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Public Employee Sign-up / Client Registration (Pending Admin or HR approval)
export const registerEmployeePublic = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      gender = "other",
      department,
      designation,
      basicSalary = 80000,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: `An account with email '${email}' already exists.` });
    }

    // Resolve or find default department and designation if not provided
    let deptId = department;
    if (!deptId) {
      const defDept = await Department.findOne();
      deptId = defDept?._id;
    }

    let desigId = designation;
    if (!desigId) {
      const defDesig = await Designation.findOne();
      desigId = defDesig?._id;
    }

    // Auto-generate employee code
    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${String(count + 1).padStart(3, "0")}`;

    const salaryStructure = computeSalaryStructure(basicSalary);

    // Create Employee with pending_approval
    const employee = await Employee.create({
      employeeCode,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      gender,
      department: deptId,
      designation: desigId,
      joiningDate: new Date(),
      status: "pending_approval", // Requires Admin or HR confirmation!
      salaryStructure,
    });

    // Create linked User account with inactive status until confirmed
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: "Employee",
      employeeId: employee._id,
      isActive: false, // Inactive until Admin or HR confirms!
      mustChangePassword: false,
    });

    employee.user = user._id;
    await employee.save();

    // Create In-App Notification for Admin and HR users
    const adminAndHrUsers = await User.find({ role: { $in: ["Admin", "HR"] } }).select("_id");
    for (const u of adminAndHrUsers) {
      await Notification.create({
        user: u._id,
        title: "New Employee Sign-Up Pending",
        message: `${firstName} ${lastName} (${employeeCode}) signed up and is waiting for HR/Admin confirmation.`,
        type: "system",
      });
    }

    await logAudit({
      actor: { id: user._id, email: user.email, role: "Employee" },
      action: "EMPLOYEE_SELF_REGISTER",
      entity: "Employee",
      entityId: employee._id,
      after: { employeeCode, email, status: "pending_approval" },
      req,
    });

    return res.status(201).json({
      message:
        "Registration submitted successfully! Your account is pending confirmation by Admin or HR. You will be able to login once confirmed.",
      employeeCode,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let employeeData = null;
    if (user.employeeId) {
      employeeData = await Employee.findById(user.employeeId)
        .populate("department", "name code")
        .populate("designation", "title")
        .lean();
    }

    return res.json({
      user: {
        ...user,
        id: user._id,
        employee: employeeData,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password does not match." });
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await logAudit({
      req,
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: user._id,
      after: { email: user.email, mustChangePassword: false },
    });

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user?.userId) {
      await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
      await logAudit({
        req,
        action: "USER_LOGOUT",
        entity: "User",
        entityId: req.user.userId,
      });
    }
    res.clearCookie("accessToken");
    return res.json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
