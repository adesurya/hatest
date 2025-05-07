const User = require('../models/User');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database'); // Tambahkan import pool

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
    const { full_name, phone_number, birth_place, birth_date } = req.body;
    
    // Update user
    const [result] = await pool.query(
      'UPDATE users SET full_name = ?, phone_number = ?, birth_place = ?, birth_date = ? WHERE id = ?',
      [full_name, phone_number, birth_place, birth_date, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
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

// Admin: Get all users (untuk admin)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, 
      u.is_admin, uc.name as role, u.created_at
      FROM users u
      JOIN user_categories uc ON u.category_id = uc.id
      ORDER BY u.created_at DESC`
    );
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Get user by ID (untuk admin)
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