/**
 * OIMS Portal - Professional HTML Email Templates
 * Designed for glassmorphic/premium institutional branding.
 */

export const getResetPasswordTemplate = (resetUrl, firstName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #1e293b;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px;
          line-height: 1.6;
        }
        .content h2 {
          color: #0f172a;
          margin-top: 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .footer {
          background-color: #f1f5f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OIMS PORTAL</h1>
          <p style="margin-top: 10px; opacity: 0.9;">Secure Identity Management</p>
        </div>
        <div class="content">
          <h2>Security Alert: Password Reset Request</h2>
          <p>Hello ${firstName || 'valued member'},</p>
          <p>We received a request to reset the password for your account in the <strong>Office Internal Management System (OIMS)</strong>.</p>
          <p>To proceed with setting a new password, please click the secure link below. This link is only valid for the next <strong>10 minutes</strong>.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset My Password</a>
          </div>

          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #64748b;">If you did not request this, please ignore this email or contact the System Administrator if you have concerns about your account security.</p>
          
          <p style="font-size: 13px; color: #94a3b8; word-break: break-all; margin-top: 20px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; 2024 Institutional Operations Management System (OIMS).<br>
          This is an automated security notification.
        </div>
      </div>
    </body>
    </html>
  `;
};
