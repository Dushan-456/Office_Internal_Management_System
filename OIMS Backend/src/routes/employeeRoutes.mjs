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
  bulkUploadEmployees,
} from "../controllers/employeeController.mjs";
import { uploadCSV } from "../middleware/uploadMiddleware.mjs";

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

// Stats — admin and top_admin (must be before /:id to avoid conflict)
router.get("/stats", restrictTo("ADMIN", "TOP_ADMIN"), getStats);

// List — admin, top_admin and dept_head
router.get("/", restrictTo("ADMIN", "TOP_ADMIN", "DEPT_HEAD"), getAllEmployees);

// Bulk Upload — admin only
router.post(
  "/bulk-upload",
  restrictTo("ADMIN"),
  uploadCSV,
  bulkUploadEmployees
);

// Single employee — admin, top_admin and dept_head
router.get("/:id", restrictTo("ADMIN", "TOP_ADMIN", "DEPT_HEAD"), getEmployeeById);

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
