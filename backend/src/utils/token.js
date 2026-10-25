import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hcm_lite_jwt_secret_key_hackathon_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "hcm_lite_jwt_refresh_secret_hackathon_2026";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
      mustChangePassword: user.mustChangePassword || false,
    },
    JWT_SECRET,
    { expiresIn: "1d" } // 1 day for demo convenience
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
