import SystemSettings from "../models/SystemSettings.mjs";
import User from "../models/User.mjs";
import { runDepartmentalReminders } from "../services/reminderService.mjs";

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get system settings (Singleton)
  * @route           GET /api/v1/settings
  * @access          Public / Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    // If no settings exist yet, create default one
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Update system settings
  * @route           PATCH /api/v1/settings
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const updateSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      settings = await SystemSettings.findOneAndUpdate({}, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Sync annual leave balance to all employees based on current global settings
  * @route           POST /api/v1/settings/sync-balances
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const syncAllBalances = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: "System settings not found" });
    }

    const { annualLeaveBalance } = settings;

    // Update all users who are not ADMIN/TOP_ADMIN (optional logic)
    // For now, update everyone except Top Admin to be safe
    const result = await User.updateMany(
      { role: { $ne: "TOP_ADMIN" } },
      { $set: { annualLeaveBalance } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully synchronized balances for ${result.modifiedCount} employees.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Manually trigger departmental leave reminders for testing
  * @route           POST /api/v1/settings/test-reminders
  * @access          Private (Admin)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const testReminders = async (req, res) => {
  try {
    const { dayOffset = 0 } = req.body;
    
    console.log(`[SettingsController] Manual Reminder Triggered for offset: ${dayOffset}`);
    
    const result = await runDepartmentalReminders(dayOffset);

    res.status(200).json({
      success: true,
      message: `Successfully sent reminders for ${result?.totalLeaves || 0} leaves across ${result?.departments || 0} departments.`,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
