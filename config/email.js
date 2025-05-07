const nodemailer = require('nodemailer');
require('dotenv').config();

// Konfigurasi transporter untuk email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === 465, // true untuk port 465, false untuk port lainnya
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verifikasi konfigurasi SMTP
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('SMTP server connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to SMTP server:', error.message);
    return false;
  }
};

module.exports = {
  transporter,
  verifyEmailConfig
};