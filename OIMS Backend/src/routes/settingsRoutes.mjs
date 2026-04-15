import { Router } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.mjs";
import {
  getSettings,
  updateSettings,
  allocateYearlyLeaves,
  testReminders,
} from "../controllers/settingsController.mjs";

const router = Router();

// Publicly accessible settings (for enums fetch)
router.get("/", getSettings);

// Protected routes (Admin only)
router.use(protect);

router.patch("/", restrictTo("ADMIN"), updateSettings);
router.post("/allocate-yearly-leaves", restrictTo("ADMIN"), allocateYearlyLeaves);
router.post("/test-reminders", restrictTo("ADMIN"), testReminders);

export default router;
