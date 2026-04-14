import { siteConfig } from '../config/siteConfig.js';

/**
 * Dashboard Department Reminder Template
 */
export const getDepartmentLeaveReminderTemplate = (departmentName, phase, leaves) => {
  const leavesHtml = leaves.map(l => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 10px;">
        <div style="font-weight: bold; color: #1e293b;">${l.applicantId.firstName} ${l.applicantId.lastName}</div>
        <div style="font-size: 0.75rem; color: #64748b;">${l.leaveType}</div>
      </td>
      <td style="padding: 12px 10px; color: #475569; font-size: 0.85rem;">
        ${l.actingOfficerId ? `${l.actingOfficerId.firstName} ${l.actingOfficerId.lastName}` : '<span style="color: #94a3b8;">N/A</span>'}
      </td>
      <td style="padding: 12px 10px; color: #475569; font-size: 0.85rem;">
        ${new Date(l.dateRange.from).toLocaleDateString()} - ${new Date(l.dateRange.to).toLocaleDateString()}
      </td>
      <td style="padding: 12px 10px; text-align: right;">
        <span style="background: #f0fdf4; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800;">
          ${l.totalDays} Days
        </span>
      </td>
    </tr>
  `).join('');

  const titleText = phase === 'today' 
    ? 'Daily Absence Briefing (Today)' 
    : (phase === 'tomorrow' ? 'Upcoming Absences Tomorrow' : `Upcoming Absences ${phase}`);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; }
        .header { text-align: center; margin-bottom: 30px; }
        p { text-align: center;  }
        .footer { text-align: center; margin-top: 40px; font-size: 0.75rem; color: #94a3b8; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: ${siteConfig.colors.primary}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: ${siteConfig.colors.primary}; margin: 0; font-size: 1.5rem;">${titleText}</h2>
          <p style="margin-top: 5px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;">
            Department: ${departmentName.replace(/_/g, ' ')}
          </p>
        </div>
        
        <p>Hello Team,</p>
        <p>
        Please find below the daily absence briefing for the ${departmentName.replace(/_/g, ' ')} Department. <br>
        This automated report provides details of approved leave for above mentioned date, including the assigned acting officers and duration of absence.</p>
        <p>
        For a complete overview of all scheduled absences, please refer to the full calendar available in the system.<br>
        </p>

        <table class="table">
          <thead>
            <tr style="text-align: left; background: #f8fafc; font-size: 0.7rem; text-transform: uppercase; color: #64748b;">
              <th style="padding: 10px;">Employee</th>
              <th style="padding: 10px;">Acting Officer</th>
              <th style="padding: 10px;">Duration</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${leavesHtml}
          </tbody>
        </table>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/leaves/calendar" class="btn">View Full Calendar</a>
        </div>

        <p>
        If you require any further clarification, please contact the relevant officer.<br>
        Kindly note that this is an automated notification. Please do not reply to this email.
        </p>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${siteConfig.name} - Official Internal Management System</p>
          <p>Please do not reply to this automated email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Personal Reminder Template for Acting Officers
 */
export const getActingOfficerPersonalReminderTemplate = (actingOfficerName, applicantName, phase) => {
  const timeContext = phase.toLowerCase().startsWith('on') ? phase : (phase === 'today' ? 'today' : 'tomorrow');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.75rem; color: #94a3b8; }
        .card { background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 4px solid ${siteConfig.colors.primary}; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 24px; background-color: ${siteConfig.colors.primary}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: ${siteConfig.colors.primary}; margin: 0;">Acting Officer Reminder</h2>
        </div>
        
        <p>Hello <strong>${actingOfficerName}</strong>,</p>
        
        <p>This is a reminder regarding your acting responsibilities.</p>

        <div class="card">
          <p style="margin: 0; font-size: 1.1rem; color: #1e293b;">
            <strong>${phase === 'today' ? 'Today' : (phase === 'tomorrow' ? 'Tomorrow' : phase.charAt(0).toUpperCase() + phase.slice(1))}</strong>, 
            <span style="color: ${siteConfig.colors.primary}; font-weight: 800;">${applicantName}</span> is on leave and you are the <strong>acting officer</strong>.
          </p>
        </div>

        <p>Please ensure you are prepared for the handover and any necessary actions required during this period.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/acting-requests" class="btn">View Request Details</a>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${siteConfig.name}</p>
          <p>This is an automated reminder.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
