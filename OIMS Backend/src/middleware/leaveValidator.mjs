import { body, param, query } from "express-validator";
import mongoose from "mongoose";

// Helper to validate ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId format");
  }
  return true;
};

export const applyLeaveValidation = [
  body("leaveType").notEmpty().withMessage("Leave type is required"),
  body("category").isIn(["Full Day", "Half Day"]).withMessage("Invalid leave category"),
  body("fromDate")
    .isISO8601()
    .withMessage("fromDate must be a valid date")
    .custom((value) => {
      const fromDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if past > 7 days
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      if (fromDate < sevenDaysAgo) {
        throw new Error("fromDate cannot be more than 7 days in the past");
      }
      return true;
    }),
  body("toDate")
    .isISO8601()
    .withMessage("toDate must be a valid date")
    .custom((value, { req }) => {
      const toDate = new Date(value);
      const fromDate = new Date(req.body.fromDate);
      if (toDate < fromDate) {
        throw new Error("toDate cannot be before fromDate");
      }
      return true;
    }),
  body("addressWhileOnLeave").notEmpty().trim().escape().withMessage("addressWhileOnLeave is required"),
  body("reason").notEmpty().trim().escape().withMessage("Reason is required"),
  body("actingOfficerId").custom(isValidObjectId).withMessage("Invalid actingOfficerId"),
  body("approveOfficerId").custom(isValidObjectId).withMessage("Invalid approveOfficerId"),
];

export const actingApproveValidation = [
  param("id").custom(isValidObjectId).withMessage("Invalid leave request ID"),
  body("status").isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected"),
];

export const finalDecisionValidation = [
  param("id").custom(isValidObjectId).withMessage("Invalid leave request ID"),
  body("status").isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected"),
];

export const deleteLeaveValidation = [
  param("id").custom(isValidObjectId).withMessage("Invalid leave request ID"),
];

export const updateLeaveValidation = [
  param("id").custom(isValidObjectId).withMessage("Invalid leave request ID"),
  ...applyLeaveValidation
];

export const validateRequest = (req, res, next) => {
  import('express-validator').then(({ validationResult }) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  });
};
