// routes/authRoutes.js
import express from "express";
import {
  login,
  getMe,
  changePassword,
  logout,
  registerEmployeePublic,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register-employee", registerEmployeePublic);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/change-password", authenticate, changePassword);

export default router;
