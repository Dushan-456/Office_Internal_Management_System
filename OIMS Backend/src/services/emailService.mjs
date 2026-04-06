import nodemailer from "nodemailer";
import "dotenv/config";


// Configurations email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,    //  Gmail address
        pass: process.env.EMAIL_APP_PASS    //  App Password 
    }
});


// transporter for production ( via SMTP):
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST, 
//     port: process.env.SMTP_PORT, 
//     secure: process.env.SMTP_SECURE === 'true', //  'true' for 465 (SSL) or 'false' for 587 (TLS)
//     auth: {
//         user: process.env.SMTP_USER, 
//         pass: process.env.SMTP_PASS, 
//     },
// });


export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};

