// File: middleware/profileAccess.js (FULL FILE)

const { pool } = require('../config/database');

// Middleware untuk cek akses profil
// Admin dapat mengakses dan mengupdate profil siapapun
// User hanya dapat mengakses dan mengupdate profil sendiri
exports.canAccessProfile = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUserId = req.user.id;
    
    // Jika user adalah admin, izinkan akses
    if (req.user.is_admin) {
      return next();
    }
    
    // Jika user bukan admin, cek apakah mengakses profil sendiri
    if (requestedUserId && parseInt(requestedUserId) !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Anda hanya dapat mengakses profil Anda sendiri'
      });
    }
    
    next();
  } catch (error) {
    console.error('Profile access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Middleware khusus untuk akses GET profile (lebih permisif)
exports.canViewProfile = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUserId = req.user.id;
    
    // Jika user adalah admin, izinkan akses
    if (req.user.is_admin) {
      return next();
    }
    
    // Jika user bukan admin, cek apakah mengakses profil sendiri
    if (requestedUserId && parseInt(requestedUserId) !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Anda hanya dapat mengakses profil Anda sendiri'
      });
    }
    
    next();
  } catch (error) {
    console.error('Profile view check error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};