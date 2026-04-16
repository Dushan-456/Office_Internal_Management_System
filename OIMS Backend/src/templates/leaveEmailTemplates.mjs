import { siteConfig } from "../config/siteConfig.js";

const getBaseEmailTemplate = (title, content) => {
  const { colors, name, motto } = siteConfig;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${colors.background}; margin: 0; padding: 0; color: ${colors.text}; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
        .content { padding: 40px; line-height: 1.6; }
        .content h2 { color: #0f172a; margin-top: 0; text-align: center; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: ${colors.textMuted}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${name}</h1>
          <p style="margin-top: 10px; opacity: 0.9;">${title}</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${name}.<br>
          This is an automated workflow notification.
        </div>
      </div>
    </body>
    </html>
  `;
};

const formatRange = (from, to) => {
  const f = new Date(from).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = new Date(to).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<strong>${f}</strong> to <strong>${t}</strong>`;
};

export const getLeaveRequestActingTemplate = (actingOfficerName, applicantName, actingUrl, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Action Required: Leave Approval",
    `
      <h2>Action Required</h2>
      <p>Dear ${actingOfficerName},</p>
      <p><strong>${applicantName}</strong> has nominated you as their Acting Officer for their upcoming leave period from ${formatRange(fromDate, toDate)}.</p>
      <p>Please log in to the portal to review and Approve the request.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${actingUrl}" style="background-color: ${siteConfig.colors.primary}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Review Acting Request</a>
      </div>
    `
  );
};

export const getLeaveApplicationConfirmationTemplate = (userName, actingOfficerName, statusUrl, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Leave Application Submitted",
    `
      <h2>Application Received</h2>
      <p>Dear ${userName},</p>
      <p>Your leave application for the period ${formatRange(fromDate, toDate)} has been successfully submitted and forwarded to <strong>${actingOfficerName}</strong> for initial approval.</p>
      <p>Please wait for the acting officer to Approve your request, after which it will be sent to the Department Head for final approval.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${statusUrl}" style="background-color: ${siteConfig.colors.primary}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Check Status</a>
      </div>
    `
  );
};

export const getLeaveNotifyDeptHeadTemplate = (deptHeadName, applicantName, approvalUrl, fromDate, toDate, actingOfficerName) => {
  const formattedFrom = new Date(fromDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTo = new Date(toDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return getBaseEmailTemplate(
    "Leave Application Pending Final Approval",
    `
      <h2>Pending Final Approval</h2>
      <p>Dear ${deptHeadName},</p>
      <p><strong>${applicantName}</strong>'s leave application for the period <strong>${formattedFrom}</strong> to <strong>${formattedTo}</strong> has been Approved by acting officer <strong>${actingOfficerName}</strong> and now requires your final decision.</p>
      <p>Please log in to the portal to review and finalize this request.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${approvalUrl}" style="background-color: ${siteConfig.colors.secondary}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Review Leave Request</a>
      </div>
    `
  );
};


export const getActingOfficerRejectionApplicantTemplate = (userName, actingOfficerName, statusUrl, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Leave Application Rejected",
    `
      <h2>Application Rejected</h2>
      <p>Dear ${userName},</p>
      <p>Your recent leave request for the period ${formatRange(fromDate, toDate)} has been <span style="color: red; font-weight: bold;">Rejected</span> by your Acting Officer, <strong>${actingOfficerName}</strong>.</p>
      <p>This request will not proceed to the Department Head.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${statusUrl}" style="background-color: ${siteConfig.colors.accent}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">View Leave History</a>
      </div>
    `
  );
};

export const getActingOfficerRejectionConfirmationTemplate = (actingOfficerName, applicantName, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Leave Rejection Confirmed",
    `
      <h2>Action Confirmed</h2>
      <p>Dear ${actingOfficerName},</p>
      <p>You have successfully <span style="color: red; font-weight: bold;">Reject</span> the leave request submitted by <strong>${applicantName}</strong> for the period ${formatRange(fromDate, toDate)}.</p>
      <p>The applicant has been notified of your decision.</p>
    `
  );
};

export const getActingOfficerApprovalApplicantTemplate = (userName, actingOfficerName, statusUrl, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Leave Application Approved by Acting Officer",
    `
      <h2>Application Approved by Acting Officer</h2>
      <p>Dear ${userName},</p>
      <p>Your leave request for the period ${formatRange(fromDate, toDate)} has been <span style="color: green; font-weight: bold;">Approved</span> by your Acting Officer, <strong>${actingOfficerName}</strong>.</p>
      <p>It has now been forwarded to your Department Head for final approval. You will receive another notification once a final decision is made.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${statusUrl}" style="background-color: ${siteConfig.colors.primary}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Check Status</a>
      </div>
    `
  );
};

export const getActingOfficerApprovalConfirmationTemplate = (actingOfficerName, applicantName, fromDate, toDate) => {
  return getBaseEmailTemplate(
    "Approve Leave Acting Request Confirmed",
    `
      <h2>Action Confirmed</h2>
      <p>Dear ${actingOfficerName},</p>
      <p>You have successfully <span style="color: green; font-weight: bold;">Approve</span> the leave request submitted by <strong>${applicantName}</strong> for the period ${formatRange(fromDate, toDate)}.</p>
      <p>The request has been forwarded to the Department Head for final approval.</p>
    `
  );
};

export const getLeaveFinalDecisionTemplate = (userName, status, statusUrl, fromDate, toDate, reviewerRole = "Department Head", rejectionReason = null) => {
  const statusHtml = status === 'approved' 
    ? '<span style="color: green; font-weight: bold;">APPROVED</span>'
    : '<span style="color: red; font-weight: bold;">REJECTED</span>';

  let reasonHtml = '';
  if (status === 'rejected' && rejectionReason) {
    reasonHtml = `
      <div style="margin-top: 20px; padding: 15px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #9f1239;">Reason for Rejection:</p>
        <p style="margin: 5px 0 0; color: #0f172a;">${rejectionReason}</p>
      </div>
    `;
  }

  return getBaseEmailTemplate(
    "Leave Application Decision",
    `
      <h2>Application Status Update</h2>
      <p>Dear ${userName},</p>
      <p>Your leave request for the period ${formatRange(fromDate, toDate)} has been marked as ${statusHtml} by your <strong>${reviewerRole}</strong>.</p>
      ${reasonHtml}
      <p style="margin-top: 25px;">Log in to the institutional portal to view the details.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${statusUrl}" style="background-color: ${siteConfig.colors.accent}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">View Leave History</a>
      </div>
    `
  );
};
export const getLeaveFinalDecisionConfirmationTemplate = (reviewerName, applicantName, status, fromDate, toDate, rejectionReason = null) => {
  const statusHtml = status === 'approved' 
    ? '<span style="color: green; font-weight: bold;">APPROVED</span>'
    : '<span style="color: red; font-weight: bold;">REJECTED</span>';

  let reasonHtml = '';
  if (status === 'rejected' && rejectionReason) {
    reasonHtml = `<p style="margin-top: 10px; font-style: italic;">Reason provided: "${rejectionReason}"</p>`;
  }

  return getBaseEmailTemplate(
    "Decision Confirmed",
    `
      <h2>Final Decision Processed</h2>
      <p>Dear ${reviewerName},</p>
      <p>The leave application submitted by <strong>${applicantName}</strong> for the period ${formatRange(fromDate, toDate)} has been finalized as ${statusHtml}.</p>
      ${reasonHtml}
      <p>The applicant has been notified of this final decision.</p>
    `
  );
};
export const getLeaveDeletionNotificationTemplate = (userName, applicantName, fromDate, toDate, isApplicant = false) => {
  const formattedFrom = new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTo = new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return getBaseEmailTemplate(
    "Leave Application Deleted",
    `
      <h2>Application Withdrawal</h2>
      <p>Dear ${userName},</p>
      <p>The leave application for <strong>${applicantName}</strong> scheduled from <strong>${formattedFrom}</strong> to <strong>${formattedTo}</strong> has been <span style="color: #e11d48; font-weight: bold;">Deleted</span>.</p>
      ${isApplicant 
        ? '<p>This is a confirmation that your request has been successfully removed from the system.</p>' 
        : '<p>The applicant has chosen to withdraw this request. No further action is required from your side.</p>'}
    `
  );
};
