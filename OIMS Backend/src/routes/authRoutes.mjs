import { Router } from "express";
import { login, updatePassword, forgotPassword, resetPassword } from "../controllers/authController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = Router();

router.post("/login", login);
router.patch("/update-password", protect, updatePassword);

// Password Reset Routes (Public)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Administrative Password Management (Protected)
router.post("/admin-reset-password/:id", protect, forgotPassword); // We can reuse forgotPassword logic or wrap it

export default router;
