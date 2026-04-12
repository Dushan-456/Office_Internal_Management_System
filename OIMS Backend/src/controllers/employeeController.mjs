import bcrypt from "bcryptjs";
import User from "../models/User.mjs";

// ─── CREATE ────────────────────────────────────────────────────────────────────
// POST /api/v1/employees
export const createEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Hash password
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

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

    const newUser = await User.create(data);

    res.status(201).json({
      success: true,
      data: { user: newUser },
    });
  } catch (error) {
    next(error);
  }
};

// ─── READ ALL ──────────────────────────────────────────────────────────────────
// GET /api/v1/employees
export const getAllEmployees = async (req, res, next) => {
  try {
    const { search, department, employeeType, page = 1, limit = 20 } = req.query;

    // Build query filter
    const filter = {};

    // DEPT_HEAD can only see their own department
    if (req.user.role === "DEPT_HEAD") {
      filter.department = req.user.department;
    }

    if (department) filter.department = department;
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

// ─── READ ONE ──────────────────────────────────────────────────────────────────
// GET /api/v1/employees/:id
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

    res.status(200).json({
      success: true,
      data: { employee: user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── READ ME ───────────────────────────────────────────────────────────────────
// GET /api/v1/employees/me
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

// ─── UPDATE ────────────────────────────────────────────────────────────────────
// PUT /api/v1/employees/:id
export const updateEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Hash password if being updated
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    } else {
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

// ─── DELETE ────────────────────────────────────────────────────────────────────
// DELETE /api/v1/employees/:id
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

// ─── STATS ─────────────────────────────────────────────────────────────────────
// GET /api/v1/employees/stats
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
