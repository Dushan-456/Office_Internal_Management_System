import { Router } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.mjs";
import {
  getSettings,
  updateSettings,
  syncAllBalances,
  testReminders,
} from "../controllers/settingsController.mjs";

const router = Router();

// Publicly accessible settings (for enums fetch)
router.get("/", getSettings);

// Protected routes (Admin only)
router.use(protect);

router.patch("/", restrictTo("ADMIN"), updateSettings);
router.post("/sync-balances", restrictTo("ADMIN"), syncAllBalances);
router.post("/test-reminders", restrictTo("ADMIN"), testReminders);

export default router;
