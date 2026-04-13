import nodemailer from 'nodemailer';

/**
 * Institutional Email Service
 * Configured for Gmail SMTP with extensibility for future notifications.
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps with some local dev environments
      }
    });
  }

  /**
   * Generic mail sender
   * @param {Object} options { email, subject, text, html }
   */
  async sendEmail(options) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"OIMS Support" <noreply@oims-portal.com>',
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Dispatch Successful: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[EmailService] Dispatch Failed: ${error.message}`);
      throw new Error('Email delivery failed. Please check SMTP configuration.');
    }
  }

  /**
   * Specialized Password Reset Dispatcher
   */
  async sendPasswordReset(user, resetUrl, html) {
    return this.sendEmail({
      email: user.email,
      subject: 'Security Alert: Password Reset Requested',
      text: `Please use the following link to reset your password: ${resetUrl}`,
      html: html
    });
  }
  /**
   * Leave Management Dispatchers
   */
  async sendLeaveRequestActingEmail(email, actingOfficerName, applicantName) {
    // Requires importing getLeaveRequestActingTemplate if used within emailService
    // We will dynamically import or pass HTML. It's better to pass HTML from controller.
  }

  // Simplified: let's just make a generic sendHtmlEmail
  async sendHtmlEmail(email, subject, html) {
    return this.sendEmail({
      email,
      subject,
      html
    });
  }
}

export default new EmailService();
