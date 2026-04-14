import {
  EMPLOYEE_TYPES,
  DEPARTMENTS,
  JOB_CATEGORIES,
  JOB_TITLES,
  GRADES,
  ROLES,
} from "../models/User.mjs";
import { LEAVE_TYPES, LEAVE_CATEGORIES } from "../models/LeaveRequest.mjs";
import SystemSettings from "../models/SystemSettings.mjs";

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get all system enums (departments, roles, leave types, etc.)
  * @route           GET /api/v1/enums
  * @access          Public
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getEnums = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();

    res.status(200).json({
      success: true,
      data: {
        employeeTypes: EMPLOYEE_TYPES,
        departments: settings?.departments?.length > 0 ? settings.departments : DEPARTMENTS,
        jobCategories: JOB_CATEGORIES,
        jobTitles: JOB_TITLES,
        grades: GRADES,
        roles: ROLES,
        // Use settings if available, otherwise fall back to model constants
        leaveTypes: settings ? settings.leaveTypes : LEAVE_TYPES,
        leaveCategories: settings ? settings.leaveCategories : LEAVE_CATEGORIES,
        gracePeriodDays: settings ? settings.gracePeriodDays : 7,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
