import { Router } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.mjs";
import { createEmployeeValidation, handleValidationErrors } from "../middleware/validationMethods.mjs";
import { uploadProfilePicture, uploadErrorHandler } from "../middleware/uploadMiddleware.mjs";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getMe,
  updateEmployee,
  deleteEmployee,
  getStats,
} from "../controllers/employeeController.mjs";

const router = Router();

// All routes are protected
router.use(protect);

// Routes accessible by all authenticated users
router.get("/me", getMe);
router.get("/directory", async (req, res) => {
  try {
    const { default: User } = await import("../models/User.mjs");
    const users = await User.find().select("firstName lastName department role email");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching directory" });
  }
});

// Stats — admin only (must be before /:id to avoid conflict)
router.get("/stats", restrictTo("ADMIN"), getStats);

// List — admin and dept_head
router.get("/", restrictTo("ADMIN", "DEPT_HEAD"), getAllEmployees);

// Single employee — admin and dept_head
router.get("/:id", restrictTo("ADMIN", "DEPT_HEAD"), getEmployeeById);

// Create — admin only (with profile picture upload)
router.post(
  "/",
  restrictTo("ADMIN"),
  uploadProfilePicture,
  uploadErrorHandler,
  createEmployeeValidation(),
  handleValidationErrors,
  createEmployee
);

// Update — admin only (with optional profile picture upload)
router.put(
  "/:id",
  restrictTo("ADMIN"),
  uploadProfilePicture,
  uploadErrorHandler,
  updateEmployee
);

// Delete — admin only
router.delete("/:id", restrictTo("ADMIN"), deleteEmployee);

export default router;
