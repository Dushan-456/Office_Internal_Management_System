import SystemSettings from '../models/SystemSettings.mjs';
import { runDepartmentalReminders } from './reminderService.mjs';

/**
 * Engine to poll settings and trigger reminders based on configurable times
 */
class ReminderEngine {
  constructor() {
    this.intervalId = null;
    this.isProcessing = false;
  }

  start() {
    if (this.intervalId) return;

    console.log('[ReminderEngine] Starting dynamic reminder engine...');
    
    // Check every minute
    this.intervalId = setInterval(() => this.checkAndRun(), 60000);
    
    // Initial check
    this.checkAndRun();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkAndRun() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const settings = await SystemSettings.findOne();
      if (!settings || !settings.leaveReminders || settings.leaveReminders.length === 0) {
        this.isProcessing = false;
        return;
      }

      const now = new Date();
      const currentHHmm = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const todayDateString = now.toISOString().split('T')[0];

      for (const reminder of settings.leaveReminders) {
        if (!reminder.enabled) continue;

        // Unique key for this reminder instance on this day
        const runKey = `${todayDateString}-${reminder.dayOffset}-${reminder.time}`;

        if (currentHHmm === reminder.time && reminder.lastRunDate !== runKey) {
          console.log(`[ReminderEngine] Triggering reminder: ${reminder.time} (Offset: ${reminder.dayOffset} days)`);
          
          await runDepartmentalReminders(reminder.dayOffset);

          // Mark as run for this specific time/day to prevent duplicates within the same minute
          await SystemSettings.updateOne(
            { "leaveReminders._id": reminder._id },
            { $set: { "leaveReminders.$.lastRunDate": runKey } }
          );
        }
      }
    } catch (error) {
      console.error('[ReminderEngine] Error:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export default new ReminderEngine();
