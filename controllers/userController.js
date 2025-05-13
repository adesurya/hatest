// File: controllers/userController.js (FULL FIXED VERSION)

const User = require('../models/User');
const UserCategory = require('../models/UserCategory');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const bcrypt = require('bcrypt');

// Konfigurasi multer untuk upload foto
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath;
    // Menentukan direktori berdasarkan jenis file
    if (file.fieldname === 'id_card_photo') {
      uploadPath = path.join(__dirname, '../uploads/id_cards');
    } else if (file.fieldname === 'profile_photo') {
      uploadPath = path.join(__dirname, '../uploads/profiles');
    } else {
      uploadPath = path.join(__dirname, '../uploads/temp');
    }
    
    // Pastikan direktori ada
    try {
      await mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter file berdasarkan tipe
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau PDF.'));
  }
};

// Setup multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware untuk upload foto
exports.uploadProfilePhotos = (req, res, next) => {
  const uploadFields = upload.fields([
    { name: 'id_card_photo', maxCount: 1 },
    { name: 'profile_photo', maxCount: 1 }
  ]);
  
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Error upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Ambil profil user
exports.getProfile = async (req, res) => {
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update profil user
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const { 
      full_name, 
      phone_number, 
      birth_place, 
      birth_date,
      institution,
      collegium_certificate_number
    } = req.body;
    
    // Siapkan path foto jika ada
    let idCardPhotoPath = null;
    let profilePhotoPath = null;
    
    if (req.files) {
      if (req.files.id_card_photo) {
        idCardPhotoPath = `/uploads/id_cards/${req.files.id_card_photo[0].filename}`;
      }
      
      if (req.files.profile_photo) {
        profilePhotoPath = `/uploads/profiles/${req.files.profile_photo[0].filename}`;
      }
    }
    
    // Ambil data user lama untuk hapus foto lama jika perlu
    const oldUser = await User.getProfile(userId);
    
    // Update user
    const profileData = {
      full_name,
      phone_number,
      birth_place,
      birth_date,
      institution,
      collegium_certificate_number
    };
    
    await User.updateProfile(userId, profileData, idCardPhotoPath, profilePhotoPath);
    
    // Hapus foto lama jika ada update
    if (idCardPhotoPath && oldUser.id_card_photo) {
      const oldFilePath = path.join(__dirname, '..', oldUser.id_card_photo);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    if (profilePhotoPath && oldUser.profile_photo) {
      const oldFilePath = path.join(__dirname, '..', oldUser.profile_photo);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Ambil profil yang telah diupdate
    const updatedProfile = await User.getProfile(userId);
    
    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      user: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Ubah password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    
    // Ambil data user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Verifikasi password saat ini
    const isMatch = await User.comparePassword(current_password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini tidak valid'
      });
    }
    
    // Update password
    await User.resetPassword(userId, new_password);
    
    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Get all users dengan pagination dan filter
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const membership_status = req.query.status;
    const category_id = req.query.category;
    const search = req.query.search;
    
    const options = {
      page,
      limit,
      membership_status,
      category_id,
      search
    };
    
    const users = await User.getAllProfiles(options);
    const total = await User.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      users,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userProfile = await User.getProfile(id);
    
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
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Update user by ID
exports.updateUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { 
      full_name, 
      email,
      phone_number, 
      birth_place, 
      birth_date,
      category_id,
      institution,
      collegium_certificate_number,
      membership_status
    } = req.body;
    
    // Validasi kategori user
    if (category_id) {
      const category = await UserCategory.getById(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Kategori keanggotaan tidak valid'
        });
      }
    }
    
    // Siapkan path foto jika ada
    let idCardPhotoPath = null;
    let profilePhotoPath = null;
    
    if (req.files) {
      if (req.files.id_card_photo) {
        idCardPhotoPath = `/uploads/id_cards/${req.files.id_card_photo[0].filename}`;
      }
      
      if (req.files.profile_photo) {
        profilePhotoPath = `/uploads/profiles/${req.files.profile_photo[0].filename}`;
      }
    }
    
    // Ambil data user lama untuk hapus foto lama jika perlu
    const oldUser = await User.getProfile(id);
    
    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Update user dengan email jika diperlukan
    if (email && email !== oldUser.email) {
      // Cek apakah email sudah digunakan
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan oleh user lain'
        });
      }
      
      // Update email
      await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    }
    
    // Update user profile
    const profileData = {
      full_name,
      phone_number,
      birth_place,
      birth_date,
      category_id,
      institution,
      collegium_certificate_number,
      membership_status
    };
    
    await User.updateProfile(id, profileData, idCardPhotoPath, profilePhotoPath);
    
    // Hapus foto lama jika ada update
    if (idCardPhotoPath && oldUser.id_card_photo) {
      const oldFilePath = path.join(__dirname, '..', oldUser.id_card_photo);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    if (profilePhotoPath && oldUser.profile_photo) {
      const oldFilePath = path.join(__dirname, '..', oldUser.profile_photo);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Ambil profil yang telah diupdate
    const updatedProfile = await User.getProfile(id);
    
    res.json({
      success: true,
      message: 'Profil user berhasil diupdate',
      user: updatedProfile
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};