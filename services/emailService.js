const { transporter } = require('../config/email');
require('dotenv').config();

class EmailService {
  // Kirim email verifikasi
  static async sendVerificationEmail(email, fullName, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-account/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verifikasi Akun Healthcare App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verifikasi Akun Anda</h2>
          <p>Halo, ${fullName}!</p>
          <p>Terima kasih telah mendaftar di Healthcare App. Untuk melanjutkan, silakan verifikasi akun Anda dengan mengklik tombol di bawah ini:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verifikasi Akun</a>
          </div>
          <p>Atau, Anda dapat menggunakan link berikut:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Link verifikasi ini akan kedaluwarsa dalam ${process.env.VERIFICATION_EXPIRY} jam.</p>
          <p>Jika Anda tidak merasa mendaftar untuk Healthcare App, silakan abaikan email ini.</p>
          <p>Salam,<br>Tim Healthcare App</p>
        </div>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
  
  // Kirim email reset password
  static async sendResetPasswordEmail(email, fullName, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Password Healthcare App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password Anda</h2>
          <p>Halo, ${fullName}!</p>
          <p>Kami menerima permintaan untuk reset password akun Healthcare App Anda. Untuk melanjutkan, silakan klik tombol di bawah ini:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Atau, Anda dapat menggunakan link berikut:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Link reset password ini akan kedaluwarsa dalam ${process.env.RESET_PASSWORD_EXPIRY} jam.</p>
          <p>Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>
          <p>Salam,<br>Tim Healthcare App</p>
        </div>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EmailService;