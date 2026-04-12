import { body } from "express-validator";
import { validationResult } from "express-validator";

// ─── Validation Error Handler ──────────────────────────────────────────────────
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ─── Employee Create Validation ────────────────────────────────────────────────
export const createEmployeeValidation = () => [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("employeeNo").notEmpty().withMessage("Employee No is required"),
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First Name is required"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last Name is required"),
  body("nicNo").notEmpty().withMessage("NIC No is required"),
  body("dateJoined").notEmpty().withMessage("Date Joined is required"),
  body("employeeType").notEmpty().withMessage("Employee Type is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("jobCategory").notEmpty().withMessage("Job Category is required"),
  body("jobTitle").notEmpty().withMessage("Job Title is required"),
];

// ─── Employee Update Validation (all optional) ────────────────────────────────
export const updateEmployeeValidation = () => [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
