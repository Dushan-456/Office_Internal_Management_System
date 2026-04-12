import { Router } from "express";
import { login, updatePassword } from "../controllers/authController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = Router();

router.post("/login", login);
router.patch("/update-password", protect, updatePassword);

export default router;
