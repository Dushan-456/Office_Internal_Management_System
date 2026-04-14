import User from '../models/User.mjs';
import LeaveRequest from '../models/LeaveRequest.mjs';
import SystemSettings from '../models/SystemSettings.mjs';
import emailService from './emailService.mjs';
import { getDepartmentLeaveReminderTemplate, getActingOfficerPersonalReminderTemplate } from '../templates/reminderEmailTemplates.mjs';

/**
 * Service to calculate and send departmental leave reminders
 */
export const runDepartmentalReminders = async (dayOffset = 0) => {
  try {
    const settings = await SystemSettings.findOne();
    const tz = settings?.timezone || "Asia/Colombo";
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const today = new Date(`${todayStr}T00:00:00Z`);
    
    // 1. Calculate the target date
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const phase = dayOffset === 0 
      ? 'today' 
      : (dayOffset === 1 ? 'tomorrow' : `on ${targetDate.toLocaleDateString('en-GB')}`);
    
    console.log(`[ReminderService] Checking for all active leaves ${phase} (${targetDateStr})`);

    // 2. Find all approved leaves that overlap with the targetDate
    const leaves = await LeaveRequest.find({
      status: 'approved',
      'dateRange.from': { $lte: targetDate },
      'dateRange.to': { $gte: targetDate }
    })
    .populate('applicantId', 'firstName lastName email department')
    .populate('actingOfficerId', 'firstName lastName email');

    if (leaves.length === 0) {
      console.log(`[ReminderService] No leaves found starting on ${targetDate.toLocaleDateString()}`);
      return;
    }

    // 3. Group leaves by department
    const deptGroups = leaves.reduce((groups, leave) => {
      const dept = leave.applicantId.department;
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(leave);
      return groups;
    }, {});

    // 4. For each department, find all employees and send a digest
    const departments = Object.keys(deptGroups);
    
    for (const dept of departments) {
      const deptLeaves = deptGroups[dept];
      const deptEmployees = await User.find({ department: dept, role: { $ne: 'TOP_ADMIN' } }).select('email');
      const emailList = deptEmployees.map(u => u.email).filter(Boolean);

      if (emailList.length === 0) continue;

      const html = getDepartmentLeaveReminderTemplate(dept, phase, deptLeaves);
      const subject = phase === 'today'
        ? `Daily Briefing: Absences in ${dept.replace(/_/g, ' ')} (Today)`
        : `Reminder: Upcoming Absences in ${dept.replace(/_/g, ' ')} (${phase.charAt(0).toUpperCase() + phase.slice(1)})`;

      console.log(`[ReminderService] Sending digest to ${emailList.length} employees in ${dept}`);
      
      // Send department emails
      await Promise.allSettled(emailList.map(email => 
        emailService.sendHtmlEmail(email, subject, html)
      ));
    }

    // 5. Send individual reminders to acting officers
    console.log(`[ReminderService] Sending ${leaves.length} personal reminders to Acting Officers`);
    await Promise.allSettled(leaves.map(async (leave) => {
      if (leave.actingOfficerId && leave.actingOfficerId.email) {
        const personalHtml = getActingOfficerPersonalReminderTemplate(
          leave.actingOfficerId.firstName,
          `${leave.applicantId.firstName} ${leave.applicantId.lastName}`,
          phase
        );
        const personalSubject = `Acting Officer Reminder: ${phase === 'today' ? 'Today' : (phase === 'tomorrow' ? 'Tomorrow' : phase)}`;
        
        await emailService.sendHtmlEmail(leave.actingOfficerId.email, personalSubject, personalHtml);
      }
    }));

    return { success: true, departments: departments.length, totalLeaves: leaves.length };
  } catch (error) {
    console.error('[ReminderService] Error running reminders:', error);
    throw error;
  }
};
