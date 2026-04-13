import mongoose from "mongoose";

export const LEAVE_TYPES = [
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
];

export const LEAVE_CATEGORIES = ["Full Day", "Half Day"];

export const LEAVE_STATUSES = [
  "pending_acting",
  "pending_approval",
  "approved",
  "rejected",
];

const leaveRequestSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      required: true,
    },
    category: {
      type: String,
      enum: LEAVE_CATEGORIES,
      required: true,
    },
    dateRange: {
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
        required: true,
      },
    },
    totalDays: {
      type: Number,
      required: true,
    },
    addressWhileOnLeave: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    actingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approveOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: LEAVE_STATUSES,
      default: "pending_acting",
    },
    actingOfficerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    deptHeadStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    attachments: {
      type: String, // Store URL/Path here
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
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

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export default LeaveRequest;
