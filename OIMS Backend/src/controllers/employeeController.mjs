import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
import SystemSettings from "../models/SystemSettings.mjs";

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
      .select("employeeNo email firstName lastName role department jobTitle profilePicture")
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
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
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
