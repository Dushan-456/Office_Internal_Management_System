import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    fingerPrintId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional at first, will be mapped if available
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ["Present", "Absent", "Late", "Half Day", "Leave"], default: "Present" },
    workHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure a user/fingerprint has only one record per date
attendanceRecordSchema.index({ fingerPrintId: 1, date: 1 }, { unique: true });

const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
export default AttendanceRecord;
