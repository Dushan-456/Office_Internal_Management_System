import AttendanceRecord from "../models/AttendanceRecord.mjs";
import User from "../models/User.mjs";
import SystemSettings from "../models/SystemSettings.mjs";
import csv from "csv-parser";
import { Readable } from "stream";
import LeaveRequest from "../models/LeaveRequest.mjs";

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get current user's attendance records for a specific month and year
  * @route           GET /api/v1/attendance/my-details
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getMyAttendance = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Year and month are required" });
    }

    const userId = req.user.id;
    // For safety, let's look up all attendance records for this user.
    // If the record has userId aligned, it will fetch.
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1); // Not inclusive

    const records = await AttendanceRecord.find({
      userId: userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: -1 });

    // Fetch approved leaves for this user in this month
    const approvedLeaves = await LeaveRequest.find({
      applicantId: userId,
      status: "approved",
      $or: [
        { "dateRange.from": { $gte: startDate, $lt: endDate } },
        { "dateRange.to": { $gte: startDate, $lt: endDate } },
        { "dateRange.from": { $lt: startDate }, "dateRange.to": { $gte: endDate } }
      ]
    });

    // Map leave status to records
    const recordsWithLeave = records.map(record => {
      const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
      const leave = approvedLeaves.find(l => {
        const from = new Date(l.dateRange.from).setHours(0, 0, 0, 0);
        const to = new Date(l.dateRange.to).setHours(0, 0, 0, 0);
        return recordDate >= from && recordDate <= to;
      });

      return {
        ...record.toObject(),
        isOnLeave: !!leave,
        leaveType: leave ? leave.leaveType : null
      };
    });

    res.status(200).json({
      success: true,
      data: recordsWithLeave
    });
  } catch (error) {
    console.error("Get My Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Upload and process attendance CSV file (admin only)
  * @route           POST /api/v1/attendance/upload-csv
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const uploadAttendanceCSV = async (req, res) => {
  try {
    // 1. Validate file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded" });
    }

    // 2. Parse configuration from the request body
    let config;
    try {
      config = JSON.parse(req.body.config);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid config JSON" });
    }

    const { fingerPrintIdCol, dateCol, timeCol, timeFormat = "24h" } = config;

    if (!fingerPrintIdCol || !dateCol || !timeCol) {
      return res.status(400).json({ 
        success: false, 
        message: "Column mapping is incomplete. Please map FingerPrint ID, Date, and Time columns." 
      });
    }

    // 3. Get system settings for late threshold and work week
    const settings = await SystemSettings.findOne();
    const lateThreshold = settings?.attendanceSettings?.lateThreshold || "08:30";
    const workWeek = settings?.workWeek || [1, 2, 3, 4, 5]; // Mon-Fri

    // Parse late threshold into hours and minutes
    const [lateHour, lateMinute] = lateThreshold.split(":").map(Number);

    // 4. Parse CSV from buffer
    const rows = [];
    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString());
      stream
        .pipe(csv())
        .on("data", (row) => {
          rows.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "CSV file is empty or could not be parsed" });
    }

    // 5. Validate that mapped columns exist in CSV headers
    const csvHeaders = Object.keys(rows[0]);
    const missingCols = [];
    if (!csvHeaders.includes(fingerPrintIdCol)) missingCols.push(`FingerPrint ID: "${fingerPrintIdCol}"`);
    if (!csvHeaders.includes(dateCol)) missingCols.push(`Date: "${dateCol}"`);
    if (!csvHeaders.includes(timeCol)) missingCols.push(`Time: "${timeCol}"`);

    if (missingCols.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Mapped columns not found in CSV: ${missingCols.join(", ")}. Available columns: ${csvHeaders.join(", ")}`,
      });
    }

    // 6. Parse and group punches by (fingerPrintId, date)
    const punchGroups = {}; // key: "fingerPrintId|YYYY-MM-DD" -> [timestamps]

    for (const row of rows) {
      const fpId = String(row[fingerPrintIdCol]).trim();
      const rawDate = String(row[dateCol]).trim();
      const rawTime = String(row[timeCol]).trim();

      if (!fpId || !rawDate || !rawTime) continue;

      // Robust Date Parsing: Handle YYYY-MM-DD and DD-MM-YYYY
      let dateParts = rawDate.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      let yr, mo, dy;

      if (dateParts) {
        // YYYY-MM-DD
        [, yr, mo, dy] = dateParts;
      } else {
        // Try DD-MM-YYYY
        dateParts = rawDate.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (dateParts) {
          [, dy, mo, yr] = dateParts;
        }
      }

      if (!dateParts) {
        console.warn(`[CSV Parser] Skipping row: Invalid date format "${rawDate}"`);
        continue;
      }
      
      const dateKey = `${yr}-${mo.padStart(2, "0")}-${dy.padStart(2, "0")}`;

      // Parse the time
      let hours, minutes;
      if (timeFormat === "12h") {
        // Handle 12-hour format (e.g., "08:20 AM" or "4:20 PM")
        const timeMatch = rawTime.match(/(\d{1,2})[:.:](\d{2})\s*(AM|PM|am|pm)?/i);
        if (!timeMatch) continue;
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const period = (timeMatch[3] || "").toUpperCase();
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      } else {
        // Handle 24-hour format (e.g., "08:20" or "08.20" or "16:20")
        const timeMatch = rawTime.match(/(\d{1,2})[:.:](\d{2})/);
        if (!timeMatch) continue;
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
      }

      const timestamp = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy), hours, minutes);
      const groupKey = `${fpId}|${dateKey}`;

      if (!punchGroups[groupKey]) {
        punchGroups[groupKey] = { fingerPrintId: fpId, dateKey, punches: [] };
      }
      punchGroups[groupKey].punches.push(timestamp);
    }

    if (Object.keys(punchGroups).length === 0) {
      return res.status(400).json({ success: false, message: "No valid attendance records could be parsed from the CSV" });
    }

    // 7. Check for duplicate records already in DB
    const dateChecks = Object.values(punchGroups).map(g => ({
      fingerPrintId: g.fingerPrintId,
      date: new Date(g.dateKey + "T00:00:00.000Z")
    }));

    const existingRecords = await AttendanceRecord.find({
      $or: dateChecks.map(dc => ({
        fingerPrintId: dc.fingerPrintId,
        date: dc.date
      }))
    }).select("fingerPrintId date");

    if (existingRecords.length > 0) {
      const duplicates = existingRecords.map(r => ({
        fingerPrintId: r.fingerPrintId,
        date: r.date.toISOString().split("T")[0]
      }));
      return res.status(409).json({
        success: false,
        message: `${duplicates.length} duplicate record(s) found. These fingerprint+date combinations already exist in the database.`,
        duplicates
      });
    }

    // 8. Resolve fingerPrintId -> userId mapping
    const uniqueFpIds = [...new Set(Object.values(punchGroups).map(g => g.fingerPrintId))];
    const users = await User.find({ fingerPrintId: { $in: uniqueFpIds } }).select("fingerPrintId _id");
    const fpToUser = {};
    users.forEach(u => { fpToUser[u.fingerPrintId] = u._id; });

    const unmatchedFingerprints = uniqueFpIds.filter(fp => !fpToUser[fp]);

    // 9. Build attendance records from punch groups
    const attendanceRecords = [];

    for (const group of Object.values(punchGroups)) {
      const { fingerPrintId, dateKey, punches } = group;
      
      // Sort punches ascending by time
      punches.sort((a, b) => a - b);
      
      const checkIn = punches[0]; // Earliest
      const checkOut = punches.length > 1 ? punches[punches.length - 1] : null; // Latest (if different)
      
      // Calculate work hours
      let workHours = 0;
      if (checkOut && checkIn) {
        workHours = parseFloat(((checkOut - checkIn) / 3600000).toFixed(2));
      }

      // Determine status based on check-in time vs late threshold
      let status = "Present";
      const checkInHour = checkIn.getHours();
      const checkInMinute = checkIn.getMinutes();
      if (checkInHour > lateHour || (checkInHour === lateHour && checkInMinute > lateMinute)) {
        status = "Late";
      }

      attendanceRecords.push({
        fingerPrintId,
        userId: fpToUser[fingerPrintId] || null,
        date: new Date(dateKey + "T00:00:00.000Z"),
        checkIn,
        checkOut,
        status,
        workHours,
      });
    }

    // 10. Fill absent days for all days with no punches (up to the max day found in CSV)
    // Determine the month range from the CSV data
    const allDates = Object.values(punchGroups).map(g => new Date(g.dateKey));
    const csvYear = allDates[0].getFullYear();
    const csvMonth = allDates[0].getMonth(); // 0-indexed
    
    // Determine the furthest day present in the CSV to avoid marking future days of the month as absent
    const maxDay = Math.max(...allDates.map(d => d.getDate()));

    let absentDaysCreated = 0;

    for (const fpId of uniqueFpIds) {
      // Get dates this person punched
      const punchedDates = new Set(
        Object.values(punchGroups)
          .filter(g => g.fingerPrintId === fpId)
          .map(g => g.dateKey)
      );

      // Check each day up to the maxDay found in the CSV
      for (let day = 1; day <= maxDay; day++) {
        const dateStr = `${csvYear}-${String(csvMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Skip if this person already has a punch for this day
        if (punchedDates.has(dateStr)) continue;

        attendanceRecords.push({
          fingerPrintId: fpId,
          userId: fpToUser[fpId] || null,
          date: new Date(dateStr + "T00:00:00.000Z"),
          checkIn: null,
          checkOut: null,
          status: "Absent",
          workHours: 0,
        });
        absentDaysCreated++;
      }
    }

    // 11. Bulk insert all records
    const inserted = await AttendanceRecord.insertMany(attendanceRecords);

    // 12. Return summary
    res.status(200).json({
      success: true,
      message: "Attendance CSV processed successfully",
      summary: {
        totalProcessed: rows.length,
        recordsInserted: inserted.length,
        punchedDays: Object.keys(punchGroups).length,
        absentDaysCreated,
        unmatchedFingerprints,
      },
    });

  } catch (error) {
    console.error("Upload Attendance CSV Error:", error);

    // Handle MongoDB duplicate key errors gracefully
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate record detected during insertion. Some records may already exist.",
        error: error.message,
      });
    }

    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get a specific employee's attendance records (Admin/DeptHead only)
  * @route           GET /api/v1/attendance/employee/:userId
  * @access          Private (Admin/DeptHead)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Year and month are required" });
    }

    // Security Check: If Dept Head, verify user is in their department
    if (req.user.role === "DEPT_HEAD") {
      const targetUser = await User.findById(userId);
      if (!targetUser || targetUser.department !== req.user.department) {
        return res.status(403).json({ success: false, message: "Unauthorized. This employee is not in your department." });
      }
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);

    const records = await AttendanceRecord.find({
      userId: userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: -1 });

    // Fetch approved leaves for this user in this month
    const approvedLeaves = await LeaveRequest.find({
      applicantId: userId,
      status: "approved",
      $or: [
        { "dateRange.from": { $gte: startDate, $lt: endDate } },
        { "dateRange.to": { $gte: startDate, $lt: endDate } },
        { "dateRange.from": { $lt: startDate }, "dateRange.to": { $gte: endDate } }
      ]
    });

    // Map leave status to records
    const recordsWithLeave = records.map(record => {
      const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
      const leave = approvedLeaves.find(l => {
        const from = new Date(l.dateRange.from).setHours(0, 0, 0, 0);
        const to = new Date(l.dateRange.to).setHours(0, 0, 0, 0);
        return recordDate >= from && recordDate <= to;
      });

      return {
        ...record.toObject(),
        isOnLeave: !!leave,
        leaveType: leave ? leave.leaveType : null
      };
    });

    res.status(200).json({
      success: true,
      data: recordsWithLeave
    });
  } catch (error) {
    console.error("Get Employee Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
