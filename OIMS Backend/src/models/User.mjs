import mongoose from "mongoose";

// ─── Enum Definitions (Single Source of Truth) ─────────────────────────────────
export const EMPLOYEE_TYPES = [
  "Assignment_Basis",
  "Probation",
  "Contract",
  "Temporary",
  "Permanent",
];

export const DEPARTMENTS = [
  "Academic",
  "Finance",
  "MERC",
  "Computer",
  "General_Administration",
  "Examination",
  "Library",
];

export const JOB_CATEGORIES = [
  "Administrative_and_Finance",
  "Academic_Support",
  "Primary_Level",
  "Academic",
  "Clerical_and_Allied",
  "Technical",
];

export const GRADES = ["Grade_I", "Grade_II", "Grade_III", "NA"];

export const ROLES = ["ADMIN", "DEPT_HEAD", "EMPLOYEE"];

export const JOB_TITLES = [
  "Assistant_Bursar",
  "Clerk",
  "Course_Coordinator",
  "Computer_programmer",
  "Deputy_Bursar",
  "Lab_Attendant",
  "Assistant_Librarian",
  "Computer_Application_Assistant",
  "Deputy_Registrar",
  "Electrician",
  "Laborer___Works_aid",
  "Assistant_Registrar",
  "Computer_Programmer_cum_System_Analyst",
  "Cycle_Orderly",
  "Driver",
  "Lecturer",
  "Library_Assistant",
  "Management_Assistant",
  "Receptionist",
  "Senior_Assistant_Registrar",
  "Senior_Technical_Officer",
  "Technical_Officer",
  "Work_Superintendent",
  "Office_Machine_Operator",
  "Senior_Assistant_Bursar",
  "Senior_Lecturer",
  "Staff_Assistant",
  "Trainee_Technical_Officer",
  "Office_Assistant",
  "Senior_Assistant_Librarian",
  "Senior_Staff_Assistant",
  "Stenographer",
  "Work_Supervisor",
  "Programme_Assistant",
  "Research_Assistant",
];

// ─── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // Identity
    employeeNo: { type: String, required: true, unique: true, trim: true },
    epfNo: { type: String, unique: true, sparse: true, trim: true },
    fingerPrintId: { type: String, unique: true, sparse: true, trim: true },
    nicNo: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },

    // Personal
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    maritalStatus: { type: String, trim: true },
    gender: { type: String, trim: true },
    dob: { type: Date },
    nationality: { type: String, trim: true },
    address: { type: String, trim: true },
    district: { type: String, trim: true },
    mobileNo: { type: String, trim: true },

    // Profile Picture
    profilePicture: { type: String, default: null },

    // Employment
    dateJoined: { type: Date, required: true },
    employeeType: {
      type: String,
      required: true,
      enum: EMPLOYEE_TYPES,
    },
    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },
    jobCategory: {
      type: String,
      required: true,
      enum: JOB_CATEGORIES,
    },
    jobTitle: {
      type: String,
      required: true,
      enum: JOB_TITLES,
    },
    grade: {
      type: String,
      enum: GRADES,
      default: "NA",
    },
    role: {
      type: String,
      enum: ROLES,
      default: "EMPLOYEE",
    },
    qualifications: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);
export default User;
