import { Router } from "express";
import { createUserValidation } from "../middleware/validationMethods.mjs";
import { createUser, getAllUsers, getMe, handleValidationErrors } from "../controllers/userController.mjs";
import { protect, restrictTo } from "../middleware/authMiddleware.mjs";

const router = Router();

// Protect all routes below
router.use(protect);

router.get("/me", getMe);

// Admin only routes (supporting both uppercase and Title case from schema)
router.use(restrictTo('ADMIN', 'Admin')); 

router.post("/", createUserValidation(), handleValidationErrors, createUser);
router.get("/", getAllUsers);

export default router;
