import { Router } from "express";
import { login, updatePassword, forgotPassword, resetPassword } from "../controllers/authController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = Router();

router.post("/login", login);
router.patch("/update-password", protect, updatePassword);

// Password Reset Routes (Public)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
