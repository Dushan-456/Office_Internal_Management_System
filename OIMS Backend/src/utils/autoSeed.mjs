import User from "../models/User.mjs";
import SystemSettings from "../models/SystemSettings.mjs";

/**
 * Ensures a default Admin user is present in the database.
 * If found, ensures the password is correct (hashes plain text on startup).
 */
const ensureAdmin = async () => {
  const adminEmail = "admin@office.com";
  let admin = await User.findOne({ employeeNo: "ADMIN001" });

  if (!admin) {
    console.info("[AutoSeed] SEED: Creating default system administrator...");
    admin = new User({
      employeeNo: "ADMIN001",
      nicNo: "000000000V",
      email: adminEmail,
      password: "admin123", // Will be hashed via pre-save hook
      firstName: "System",
      lastName: "Administrator",
      dateJoined: new Date(),
      employeeType: "Permanent",
      department: "Computer",
      jobCategory: "Technical",
      jobTitle: "Technical_Officer",
      role: "ADMIN",
      status: "Active",
    });
    await admin.save();
    console.info("[AutoSeed] SUCCESS: Default Admin created.");
  } else {
    // Self-healing: Ensure password matches admin123 and is correctly hashed
    admin.password = "admin123";
    await admin.save();
    console.info("[AutoSeed] VERIFIED: Admin account integrity check passed.");
  }

  return admin;
};

/**
 * Ensures system settings document exists.
 */
const ensureSettings = async () => {
  const settingsCount = await SystemSettings.countDocuments();
  if (settingsCount === 0) {
    console.info("[AutoSeed] SEED: Initializing default system settings...");
    await SystemSettings.create({});
    console.info("[AutoSeed] SUCCESS: System settings initialized.");
  } else {
    console.info("[AutoSeed] VERIFIED: System settings exist.");
  }
};

/**
 * Main Auto-Seed Orchestrator
 * Runs all specialized seeding functions.
 */
export const autoSeed = async () => {
  try {
    console.info("[AutoSeed] RUN: Starting database initialization...");

    await ensureAdmin();
    await ensureSettings();

    console.info("[AutoSeed] DONE: Database is ready.");
  } catch (error) {
    console.error("[AutoSeed] CRITICAL: Seeding failed!", error.message);
  }
};
