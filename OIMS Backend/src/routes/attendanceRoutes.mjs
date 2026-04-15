import { Router } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.mjs";
import { getMyAttendance, uploadAttendanceCSV, getEmployeeAttendance } from "../controllers/attendanceController.mjs";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes (Logged in users)
router.use(protect);

router.get("/my-details", getMyAttendance);

// Admin/DeptHead: Get employee attendance
router.get("/employee/:userId", restrictTo("ADMIN", "TOP_ADMIN", "DEPT_HEAD"), getEmployeeAttendance);

// Admin-only: Upload attendance CSV
router.post("/upload-csv", restrictTo("ADMIN"), upload.single("csvFile"), uploadAttendanceCSV);

export default router;
