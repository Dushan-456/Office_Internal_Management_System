import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.mjs";
import User from "../models/User.mjs";

async function main() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("Seeding default Admin user...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await User.findOneAndUpdate(
    { employeeNo: "ADMIN001" },
    {
      $setOnInsert: {
        employeeNo: "ADMIN001",
        nicNo: "000000000V",
        email: "admin@office.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Administrator",
        dateJoined: new Date(),
        employeeType: "Permanent",
        department: "Computer",
        jobCategory: "Technical",
        jobTitle: "Technical_Officer",
        grade: "NA",
        role: "ADMIN",
        qualifications: { degree: "BSc in Computer Science" },
      },
    },
    { upsert: true, new: true }
  );

  console.log("Default Admin created or already exists!");
  console.log("--- LOGIN CREDENTIALS ---");
  console.log("Email: admin@office.com");
  console.log("Password: admin123");
  console.log("---------------------------");

  await mongoose.disconnect();
  console.log("Database disconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
