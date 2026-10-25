// routes/aiRoutes.js
import express from "express";
import {
  chatWithAssistant,
  summarizeDashboard,
  parseSmartLeave,
} from "../controllers/aiController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// AI Chat with scoped tool execution (All roles)
router.post("/chat", chatWithAssistant);

// AI Dashboard Summary (Admin & HR)
router.post("/summarize", summarizeDashboard);

// AI Smart Leave Pre-fill (Employee self-service)
router.post("/smart-leave", parseSmartLeave);

export default router;
