import { Router } from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { applyLeaveValidation, actingApproveValidation, finalDecisionValidation, deleteLeaveValidation, updateLeaveValidation, validateRequest } from "../middleware/leaveValidator.mjs";
import { uploadLeaveAttachment, uploadErrorHandler } from "../middleware/uploadMiddleware.mjs";
import {
  applyLeave,
  approveActing,
  finalDecision,
  getMyLeaveRequests,
  getPendingActingRequests,
  getAllActingRequests,
  getPendingApprovalRequests,
  getAllLeaveRequests,
  getEmployeeLeaveHistory,
  deleteLeaveRequest,
  updateLeaveRequest,
  getMyPendingCount
} from "../controllers/leaveController.mjs";

const router = Router();

// All leave routes require authentication
router.use(protect);

// Apply for Leave
router.post(
  "/apply",
  uploadLeaveAttachment,
  uploadErrorHandler,
  applyLeaveValidation,
  validateRequest,
  applyLeave
);

// Delete Leave
router.delete(
  "/:id",
  deleteLeaveValidation,
  validateRequest,
  deleteLeaveRequest
);

// Update/Edit Leave (requires same validation/upload logic as Apply)
router.put(
  "/:id",
  uploadLeaveAttachment,
  uploadErrorHandler,
  updateLeaveValidation,
  validateRequest,
  updateLeaveRequest
);

// Get My Leaves
router.get("/my-pending-count", getMyPendingCount);
router.get("/my-requests", getMyLeaveRequests);

// Get Acting Requests
router.get("/pending-acting", getPendingActingRequests);
router.get("/all-acting", getAllActingRequests);

// Get Dept Head Approval Requests
router.get("/pending-approval", getPendingApprovalRequests);

// Get all requests (for Admin or Dept Head summary)
router.get("/all", getAllLeaveRequests);
router.get("/employee/:userId", getEmployeeLeaveHistory);

// Acting Officer Approval
router.patch(
  "/acting-approve/:id",
  actingApproveValidation,
  validateRequest,
  approveActing
);

// Final Decision (Dept Head)
router.patch(
  "/final-decision/:id",
  finalDecisionValidation,
  validateRequest,
  finalDecision
);

export default router;
