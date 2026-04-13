import {
  EMPLOYEE_TYPES,
  DEPARTMENTS,
  JOB_CATEGORIES,
  JOB_TITLES,
  GRADES,
  ROLES,
} from "../models/User.mjs";
import { LEAVE_TYPES, LEAVE_CATEGORIES } from "../models/LeaveRequest.mjs";

// GET /api/v1/enums
export const getEnums = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      employeeTypes: EMPLOYEE_TYPES,
      departments: DEPARTMENTS,
      jobCategories: JOB_CATEGORIES,
      jobTitles: JOB_TITLES,
      grades: GRADES,
      roles: ROLES,
      leaveTypes: LEAVE_TYPES,
      leaveCategories: LEAVE_CATEGORIES,
    },
  });
};
