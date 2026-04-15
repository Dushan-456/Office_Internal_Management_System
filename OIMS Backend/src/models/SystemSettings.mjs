import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    // Leave configurations
    leaveTypes: {
      type: [String],
      default: [
        "Casual",
        "Vacation",
        "Medical",
        "No Pay Leave",
        "Study Leave",
        "Sabbatical Leave",
        "Approved No Pay Leave",
        "Maternity Leave",
        "Maternity Special No Pay Leave",
        "Paternal Leave",
        "Duty Leave",
        "Lieu Leave",
        "Special Approved Leave",
      ],
    },
    leaveCategories: {
      type: [String],
      default: ["Full Day", "Half Day"],
    },
    departments: {
      type: [String],
      default: [
        "Academic",
        "Finance",
        "MERC",
        "Computer",
        "General_Administration",
        "Examination",
        "Library",
      ],
    },
    annualLeaveBalance: {
      type: Number,
      default: 45,
    },
    workWeek: {
      type: [Number], // 0-6 (Sun-Sat)
      default: [1, 2, 3, 4, 5], // Mon-Fri
    },
    gracePeriodDays: {
      type: Number,
      default: 7,
    },
    timezone: {
      type: String,
      default: "Asia/Colombo", // Defaulting to user's region based on current time context
    },
    
    // Granular Email Matrix
    emailNotifications: {
      onApply: {
        applicant: { type: Boolean, default: true },
        actingOfficer: { type: Boolean, default: true },
      },
      onActingDecision: {
        applicant: { type: Boolean, default: true },
        actingOfficer: { type: Boolean, default: true },
        approver: { type: Boolean, default: true },
      },
      onFinalDecision: {
        applicant: { type: Boolean, default: true },
        actingOfficer: { type: Boolean, default: true },
        approver: { type: Boolean, default: true },
      },
    },

    // Dashboard visibility
    dashboardLeaveVisibility: {
      type: String,
      enum: ["ALL", "DEPT_HEAD_ONLY"],
      default: "ALL",
    },

    // Attendance configurations
    attendanceSettings: {
      lateThreshold: { type: String, default: "08:30" },      // HH:mm — check-in after this = "Late"
      standardWorkHours: { type: Number, default: 8 },       // Standard daily work hours
    },

    // Configurable reminders
    leaveReminders: [
      {
        dayOffset: { type: Number, default: 0 }, // 0: today, 1: tomorrow, etc.
        time: { type: String, default: "08:00" }, // HH:mm format
        enabled: { type: Boolean, default: true },
        lastRunDate: { type: String, default: "" }, // Format: YYYY-MM-DD-offset-time
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
export default SystemSettings;
