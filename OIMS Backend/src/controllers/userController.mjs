import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from "../config/db.mjs";

// Helper to check validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

export const createUser = async (req, res, next) => {
  try {
    const data = req.body;

    // Hash password
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    if(data.dateJoined) data.dateJoined = new Date(data.dateJoined);
    if(data.dob) data.dob = new Date(data.dob);

    const newUser = await prisma.user.create({
      data
    });

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      success: true,
      data: { user: newUser }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeNo: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        jobTitle: true,
      }
    });

    res.status(200).json({
      success: true,
      results: users.length,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if(user) user.password = undefined;

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
