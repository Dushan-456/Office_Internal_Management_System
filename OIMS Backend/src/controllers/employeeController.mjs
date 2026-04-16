import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
import SystemSettings from "../models/SystemSettings.mjs";
import AttendanceRecord from "../models/AttendanceRecord.mjs";
import LeaveRequest from "../models/LeaveRequest.mjs";
import Notification from "../models/Notification.mjs";
import csv from "csv-parser";
import { Readable } from "stream";
import { 
  EMPLOYEE_TYPES, 
  DEPARTMENTS, 
  JOB_CATEGORIES, 
  GRADES, 
  ROLES, 
  JOB_TITLES 
} from "../models/User.mjs";

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Upload and process employee CSV file (admin only)
  * @route           POST /api/v1/employees/bulk-upload
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const bulkUploadEmployees = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded" });
    }

    // 1. Fetch system settings for dynamic departments and leave balance
    const settings = await SystemSettings.findOne();
    const systemDepartments = settings?.departments || DEPARTMENTS;
    const defaultLeaveBalance = settings?.annualLeaveBalance || 45;
    const currentYear = new Date().getFullYear();

    // 2. Parse CSV
    const rows = [];
    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString());
      stream
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "CSV file is empty" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };


    // Helper for fuzzy mapping / ID lookup
    const mapToEnum = (input, enumArray, fieldName, rowIndex) => {
      if (!input) return null;
      const cleanInput = String(input).trim();
      
      // Check if it's a numeric ID (1-based index)
      if (/^\d+$/.test(cleanInput)) {
        const index = parseInt(cleanInput) - 1;
        if (index >= 0 && index < enumArray.length) {
          return enumArray[index];
        }
      }

      // Fuzzy string matching
      const normalizedInput = cleanInput.toLowerCase().replace(/[\s_-]/g, "");
      const match = enumArray.find(val => 
        val.toLowerCase().replace(/[\s_-]/g, "") === normalizedInput
      );

      if (match) return match;

      results.errors.push(`Row ${rowIndex + 2}: Invalid ${fieldName} '${input}'. Valid options (IDs): ${enumArray.map((v, i) => `${i+1}:${v}`).join(", ")}`);
      return null;
    };

    const usersToCreate = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i;

      // Map required enums
      const department = mapToEnum(row.department, systemDepartments, "Department", rowIndex);
      const role = mapToEnum(row.role || "EMPLOYEE", ROLES, "Role", rowIndex);
      const jobTitle = mapToEnum(row.jobTitle, JOB_TITLES, "Job Title", rowIndex);
      const employeeType = mapToEnum(row.employeeType, EMPLOYEE_TYPES, "Employee Type", rowIndex);
      const jobCategory = mapToEnum(row.jobCategory, JOB_CATEGORIES, "Job Category", rowIndex);
      const grade = mapToEnum(row.grade || "NA", GRADES, "Grade", rowIndex);

      // Basic required field validation
      if (!row.firstName || !row.lastName || !row.email || !row.employeeNo) {
        results.errors.push(`Row ${rowIndex + 2}: Missing core identity (Name, Email, or Employee No)`);
        results.failed++;
        continue;
      }

      if (!department || !jobTitle || !employeeType) {
        results.failed++;
        continue;
      }

      // Strict Chronological Validation
      let parsedDateJoined = new Date();
      if (row.dateJoined) {
        parsedDateJoined = new Date(row.dateJoined);
        if (isNaN(parsedDateJoined.getTime())) {
          results.errors.push(`Row ${rowIndex + 2}: Invalid Date Joined format "${row.dateJoined}". Please use YYYY-MM-DD.`);
          results.failed++;
          continue;
        }
      }

      let parsedDob = undefined;
      if (row.dob) {
        parsedDob = new Date(row.dob);
        if (isNaN(parsedDob.getTime())) {
          results.errors.push(`Row ${rowIndex + 2}: Invalid DOB format "${row.dob}". Please use YYYY-MM-DD.`);
          results.failed++;
          continue;
        }
      }

      const userData = {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email.toLowerCase().trim(),
        employeeNo: row.employeeNo,
        epfNo: row.epfNo || undefined,
        fingerPrintId: row.fingerPrintId || undefined,
        nicNo: row.nicNo || `TBD-${rowIndex}-${Date.now()}`, // NIC is required in schema, generate unique fallback if missing
        department,
        role,
        jobTitle,
        employeeType,
        jobCategory: jobCategory || JOB_CATEGORIES[0],
        grade,
        password: row.password || "123456",
        mustChangePassword: true,
        dateJoined: parsedDateJoined,
        dob: parsedDob,
        gender: row.gender || "Other",
        maritalStatus: row.maritalStatus || "Single",
        nationality: row.nationality || "Sri Lankan",
        address: row.address || "TBD",
        district: row.district || "TBD",
        mobileNo: row.mobileNo || "TBD",
        leaveBalances: [{ year: currentYear, annualBalance: defaultLeaveBalance }]
      };

      usersToCreate.push(userData);
    }

    // Insert Users and handle potential primary key conflicts
    for (const userData of usersToCreate) {
      try {
        await User.create(userData);
        results.success++;
      } catch (err) {
        results.failed++;
        if (err.code === 11000) {
          const field = Object.keys(err.keyPattern)[0];
          results.errors.push(`Duplicate Record: ${field} '${userData[field]}' already exists in the institutional database.`);
        } else {
          results.errors.push(`System Error: ${err.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Enrolment completed: ${results.success} admitted, ${results.failed} rejected.`,
      data: results
    });

  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Create a new employee record (Admin only)
  * @route           POST /api/v1/employees
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const createEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Password will be hashed by User model pre-save hook

    // Parse dates
    if (data.dateJoined) data.dateJoined = new Date(data.dateJoined);
    if (data.dob) data.dob = new Date(data.dob);

    // Parse qualifications if sent as JSON string
    if (typeof data.qualifications === "string") {
      try {
        data.qualifications = JSON.parse(data.qualifications);
      } catch {
        // leave as-is if not valid JSON
      }
    }

    // Handle profile picture upload
    if (req.file) {
      data.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    // Initialize leaveBalances array with the current year
    const currentYear = new Date().getFullYear();
    const settings = await SystemSettings.findOne();
    const defaultBalance = settings?.annualLeaveBalance || 45;
    data.leaveBalances = [{ year: currentYear, annualBalance: defaultBalance }];

    const newUser = await User.create(data);

    res.status(201).json({
      success: true,
      data: { user: newUser },
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get a paginated list of all employees (Admin/DeptHead only)
  * @route           GET /api/v1/employees
  * @access          Private (Admin, DeptHead)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getAllEmployees = async (req, res, next) => {
  try {
    const { search, department, employeeType, page = 1, limit = 20 } = req.query;

    // Build query filter
    const filter = {};

    // DEPT_HEAD can only see their own department
    if (req.user.role === "DEPT_HEAD") {
      filter.department = req.user.department;
    } else if (req.user.role === "ADMIN" || req.user.role === "TOP_ADMIN") {
      // Admin and Top Admin can filter by any department if provided, otherwise see all
      if (department) filter.department = department;
    } else if (department) {
      filter.department = department;
    }
    if (employeeType) filter.employeeType = employeeType;

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { employeeNo: regex },
        { email: regex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("employeeNo email firstName lastName role department jobTitle profilePicture status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      results: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: { employees: users },
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get detailed information for a specific employee
  * @route           GET /api/v1/employees/:id
  * @access          Private (Admin, DeptHead)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getEmployeeById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found.`,
      });
    }

    // DEPT_HEAD can only see employees in their department
    if (req.user.role === "DEPT_HEAD" && user.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "You can only view employees in your department.",
      });
    }

    // TOP_ADMIN and ADMIN can see everyone, no restriction here.

    res.status(200).json({
      success: true,
      data: { employee: user },
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get currently authenticated user's profile
  * @route           GET /api/v1/employees/me
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Update an existing employee record
  * @route           PUT /api/v1/employees/:id
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const updateEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Password will be hashed by User model pre-save hook if it exists
    if (!data.password) {
      delete data.password; // Don't overwrite with empty
    }

    // Parse dates
    if (data.dateJoined) data.dateJoined = new Date(data.dateJoined);
    if (data.dob) data.dob = new Date(data.dob);

    // Parse qualifications if sent as JSON string
    if (typeof data.qualifications === "string") {
      try {
        data.qualifications = JSON.parse(data.qualifications);
      } catch {
        // leave as-is
      }
    }

    // Handle profile picture upload
    if (req.file) {
      data.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: { employee: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Delete an employee record
  * @route           DELETE /api/v1/employees/:id
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const deleteEmployee = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists before deleting related data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${userId} not found.`,
      });
    }

    // Cascade delete all related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      AttendanceRecord.deleteMany({ userId }),
      LeaveRequest.deleteMany({ applicantId: userId }),
      Notification.deleteMany({ recipientId: userId })
    ]);

    res.status(200).json({
      success: true,
      message: "Employee and all associated records deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get high-level organizational statistics (Headcount, Department distribution)
  * @route           GET /api/v1/employees/stats
  * @access          Private (Admin, Top Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getStats = async (req, res, next) => {
  try {
    const [totalEmployees, byDepartment, byEmployeeType] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$employeeType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        byDepartment: byDepartment.map((d) => ({
          department: d._id,
          count: d.count,
        })),
        byEmployeeType: byEmployeeType.map((t) => ({
          employeeType: t._id,
          count: t.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
