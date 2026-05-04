import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.mjs";
import User from "../models/User.mjs";
import LeaveRequest from "../models/LeaveRequest.mjs";

const DEPARTMENTS_TO_SEED = ["Academic", "Finance", "Computer"];
const EMPLOYEES_PER_DEPT = 5;
const LEAVES_PER_EMPLOYEE = 15;

// Production Env
// # 2. Start the services (if not already running)
// docker-compose up -d
// # 3. Run the seed script
// docker-compose exec backend node src/seeds/sample_seed.mjs


// Dev Env
// node src/seeds/sample_seed.mjs



async function seedData() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    // Clear existing data (Optional: Remove if you want to keep existing users)
    console.log("Clearing existing users and leave requests...");
    await User.deleteMany({ role: { $in: ["DEPT_HEAD", "EMPLOYEE"] } });
    await LeaveRequest.deleteMany({});

    const password = "password123";
    const departmentHeads = [];
    const allEmployees = [];

    // 1. Create Department Heads
    console.log("Seeding Department Heads...");
    for (let i = 0; i < DEPARTMENTS_TO_SEED.length; i++) {
      const dept = DEPARTMENTS_TO_SEED[i];
      const deptHead = await User.create({
        employeeNo: `DH${(i + 1).toString().padStart(3, "0")}`,
        nicNo: `${(i + 1).toString().repeat(9)}V`,
        email: `head.${dept.toLowerCase()}@office.com`,
        password: password,
        firstName: `${dept}`,
        lastName: "Head",
        dateJoined: new Date(),
        employeeType: "Permanent",
        department: dept,
        jobCategory: "Administrative_and_Finance",
        jobTitle: "Director",
        role: "DEPT_HEAD",
        leaveBalances: [{ year: new Date().getFullYear(), annualBalance: 45 }],
      });
      departmentHeads.push(deptHead);
      console.log(`Created Head for ${dept}: ${deptHead.email}`);
    }

    // 2. Create Employees
    console.log("Seeding Employees...");
    for (let i = 0; i < DEPARTMENTS_TO_SEED.length; i++) {
      const dept = DEPARTMENTS_TO_SEED[i];
      const head = departmentHeads[i];

      for (let j = 1; j <= EMPLOYEES_PER_DEPT; j++) {
        const empIndex = i * EMPLOYEES_PER_DEPT + j;
        const employee = await User.create({
          employeeNo: `EMP${empIndex.toString().padStart(3, "0")}`,
          nicNo: `95${empIndex.toString().padStart(7, "0")}V`,
          email: `emp${empIndex}@${dept.toLowerCase()}.com`,
          password: password,
          firstName: `Employee`,
          lastName: `${empIndex}`,
          dateJoined: new Date(),
          employeeType: "Permanent",
          department: dept,
          jobCategory: "Academic_Support",
          jobTitle: "Management_Assistant",
          role: "EMPLOYEE",
          leaveBalances: [{ year: new Date().getFullYear(), annualBalance: 45 }],
        });
        allEmployees.push({ employee, head });
        console.log(`Created Employee: ${employee.email} in ${dept}`);
      }
    }

    // 3. Create Leave Requests
    console.log("Seeding Leave Requests...");
    const leaveTypes = ["Casual", "Vacation", "Medical"];
    const statuses = ["approved", "rejected", "pending_acting", "pending_approval"];

    for (const { employee, head } of allEmployees) {
      // Find another employee in the same department for acting officer
      const deptEmployees = allEmployees
        .filter(e => e.employee.department === employee.department && e.employee.id !== employee.id)
        .map(e => e.employee);
      
      const actingOfficer = deptEmployees[0] || head; // Fallback to head if no other employee

      for (let k = 0; k < LEAVES_PER_EMPLOYEE; k++) {
        let status;
        let actingOfficerStatus = "approved";
        let deptHeadStatus = "pending";
        let fromDate = new Date();

        if (k < 10) {
          // Historical Leaves (Mix of Statuses)
          if (k < 3) {
            status = "approved";
            actingOfficerStatus = "approved";
            deptHeadStatus = "approved";
          } else if (k < 6) {
            status = "rejected";
            actingOfficerStatus = "approved";
            deptHeadStatus = "rejected";
          } else if (k < 8) {
            status = "pending_acting";
            actingOfficerStatus = "pending";
            deptHeadStatus = "pending";
          } else {
            status = "pending_approval";
            actingOfficerStatus = "approved";
            deptHeadStatus = "pending";
          }
          fromDate.setDate(fromDate.getDate() + (k * 5) - 45); 
        } else {
          // Upcoming Leaves (Future Dates)
          if (k < 12) {
            status = "approved";
            actingOfficerStatus = "approved";
            deptHeadStatus = "approved";
          } else {
            status = Math.random() > 0.5 ? "pending_approval" : "pending_acting";
            actingOfficerStatus = status === "pending_approval" ? "approved" : "pending";
            deptHeadStatus = "pending";
          }
          fromDate.setDate(fromDate.getDate() + ((k - 10) * 7) + 5); // 5, 12, 19, 26, 33 days in future
        }

        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 2);

        await LeaveRequest.create({
          applicantId: employee.id,
          leaveType: leaveTypes[k % leaveTypes.length],
          category: "Full Day",
          dateRange: {
            from: fromDate,
            to: toDate,
          },
          totalDays: 3,
          addressWhileOnLeave: "123 Sample Street, City",
          reason: k < 10 ? `Past leave reason ${k + 1}` : `Upcoming leave request ${k - 9}`,
          actingOfficerId: actingOfficer.id,
          approveOfficerId: head.id,
          status: status,
          actingOfficerStatus: actingOfficerStatus,
          deptHeadStatus: deptHeadStatus,
          rejectionReason: status === "rejected" ? "Requirements not met or overlapping duties." : null,
          actingOfficerDecisionDate: (status !== "pending_acting" && k < 10) ? new Date() : (status === "approved" && k >= 10 ? new Date() : null),
          deptHeadDecisionDate: ((status === "approved" || status === "rejected") && k < 10) ? new Date() : (status === "approved" && k >= 10 ? new Date() : null),
        });
      }
      console.log(`Created ${LEAVES_PER_EMPLOYEE} leaves for ${employee.email}`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
