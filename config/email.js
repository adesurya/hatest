const nodemailer = require('nodemailer');
require('dotenv').config();

// Debugging: Check if env variables are loaded correctly
console.log('Config:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT
});

// Konfigurasi transporter untuk email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10), // Convert to number
  secure: true, // Always use SSL for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  },
  // Increase timeout (optional)
  connectionTimeout: 10000
});

// Verifikasi konfigurasi SMTP
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('SMTP server connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to SMTP server:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

// Test sending an email
const sendTestEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "your-test-email@example.com", // Replace with your email
      subject: "Test Email",
      text: "This is a test email from Nodemailer",
      html: "<b>This is a test email from Nodemailer</b>"
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

module.exports = {
  transporter,
  verifyEmailConfig,
  sendTestEmail
};