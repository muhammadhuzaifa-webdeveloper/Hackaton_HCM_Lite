import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "hcm_lite_jwt_secret_key_hackathon_2026";

export const authenticate = async (req, res, next) => {
  let token = null;

  // 1. Authorization header (case-insensitive check)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader.trim();
    }
  }

  // 2. Cookie fallback
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 3. Query param fallback (for direct PDF stream links)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is still active in database
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account has been deactivated. Contact Admin." });
    }

    req.user = {
      _id: user._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? user.employeeId.toString() : null,
      mustChangePassword: user.mustChangePassword || false,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session token." });
  }
};

/**
 * Role-Based Access Control Guard
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated request." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.` 
      });
    }
    next();
  };
};

/**
 * Data Scope Guard: Ensures Employee can only read/write their own records
 */
export const dataScopeGuard = (paramKey = "employeeId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated request." });
    }

    // Admin and HR have company/HR level data scope
    if (req.user.role === "Admin" || req.user.role === "HR") {
      return next();
    }

    // For Employee role: restrict to own employeeId
    const targetEmployeeId = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
    
    if (targetEmployeeId && targetEmployeeId !== req.user.employeeId) {
      return res.status(403).json({ 
        message: "Forbidden: You are only allowed to view or modify your own records." 
      });
    }

    // Automatically enforce employeeId in queries or creation for Employee
    if (!targetEmployeeId) {
      req.query[paramKey] = req.user.employeeId;
    }

    next();
  };
};

export default authenticate;
