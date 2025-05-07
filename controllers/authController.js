const User = require('../models/User');
const UserCategory = require('../models/UserCategory');
const EmailService = require('../services/emailService');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// Pendaftaran user baru
exports.register = async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { full_name, email, phone_number, password, birth_place, birth_date, category } = req.body;
    
    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }
    
    // Validasi kategori user
    const categoryData = await UserCategory.getByName(category);
    if (!categoryData || !['Dokter', 'dokterMuda'].includes(categoryData.name)) {
      return res.status(400).json({
        success: false,
        message: 'Kategori user tidak valid'
      });
    }
    
    // Buat user baru
    const userData = {
      full_name,
      email,
      phone_number,
      password,
      birth_place,
      birth_date,
      category_id: categoryData.id
    };
    
    const newUser = await User.create(userData);
    
    // Kirim email verifikasi
    await EmailService.sendVerificationEmail(email, full_name, newUser.verificationToken);
    
    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil. Silakan cek email Anda untuk verifikasi akun.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Verifikasi akun
exports.verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid'
      });
    }
    
    const verified = await User.verifyAccount(token);
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid atau telah kedaluwarsa'
      });
    }
    
    res.json({
      success: true,
      message: 'Akun berhasil diverifikasi. Silakan login.'
    });
  } catch (error) {
    console.error('Verify account error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Cek apakah user ada
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password tidak valid'
      });
    }
    
    // Cek apakah akun sudah diverifikasi
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Akun belum diverifikasi. Silakan cek email Anda untuk verifikasi.'
      });
    }
    
    // Verifikasi password
    const isMatch = await User.comparePassword(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password tidak valid'
      });
    }
    
    // Ambil informasi kategori user
    const category = await UserCategory.getById(user.category_id);
    const userRole = category ? category.name : null;
    
    // Buat payload untuk JWT
    const userForToken = {
      id: user.id,
      email: user.email,
      role: userRole,
      is_admin: user.is_admin
    };
    
    // Generate token
    const token = generateToken(userForToken);
    
    // Ambil data profile
    const userProfile = await User.getProfile(user.id);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email } = req.body;
    
    // Cek apakah email terdaftar
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Untuk alasan keamanan, kita tetap mengembalikan respons sukses meskipun email tidak ditemukan
      return res.json({
        success: true,
        message: 'Jika email terdaftar, instruksi reset password akan dikirim ke email tersebut.'
      });
    }
    
    // Generate reset token
    const resetTokenData = await User.createResetToken(email);
    
    if (!resetTokenData) {
      return res.status(400).json({
        success: false,
        message: 'Gagal membuat token reset password'
      });
    }
    
    // Kirim email reset password
    await EmailService.sendResetPasswordEmail(email, user.full_name, resetTokenData.resetToken);
    
    res.json({
      success: true,
      message: 'Instruksi reset password telah dikirim ke email Anda.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Verify reset password token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password tidak valid'
      });
    }
    
    const user = await User.verifyResetToken(token);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password tidak valid atau telah kedaluwarsa'
      });
    }
    
    res.json({
      success: true,
      message: 'Token reset password valid',
      userId: user.id
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { token, password } = req.body;
    
    // Verifikasi token
    const user = await User.verifyResetToken(token);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password tidak valid atau telah kedaluwarsa'
      });
    }
    
    // Reset password
    const success = await User.resetPassword(user.id, password);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal reset password'
      });
    }
    
    res.json({
      success: true,
      message: 'Password berhasil diubah. Silakan login dengan password baru Anda.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userProfile = await User.getProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};