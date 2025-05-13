const AboutProfile = require('../models/AboutProfile');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Use JPG, JPEG, PNG, GIF, or WebP.'));
    }
  }
}).single('image');

// Middleware for file upload
exports.uploadImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
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

// Get all about profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const activeOnly = req.query.active_only === 'true';
    
    const options = {
      page,
      limit,
      activeOnly
    };
    
    const profiles = await AboutProfile.getAll(options);
    const total = await AboutProfile.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      profiles,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all about profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get about profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await AboutProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get about profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create new about profile (admin only)
exports.createProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      title, 
      description, 
      display_order, 
      is_active 
    } = req.body;
    
    // Prepare profile data
    const profileData = {
      title,
      description,
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: is_active === 'true',
      created_by: req.user.id
    };
    
    // Create new profile
    const newProfile = await AboutProfile.create(profileData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Profil berhasil dibuat',
      profile: newProfile
    });
  } catch (error) {
    console.error('Create about profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update about profile (admin only)
exports.updateProfile = async (req, res) => {
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
      title, 
      description, 
      display_order, 
      is_active 
    } = req.body;
    
    // Check if profile exists
    const profile = await AboutProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil tidak ditemukan'
      });
    }
    
    // Prepare profile data
    const profileData = {
      title,
      description,
      display_order: display_order !== undefined ? parseInt(display_order) : profile.display_order,
      is_active: is_active !== undefined ? is_active === 'true' : profile.is_active
    };
    
    // Update profile
    const updatedProfile = await AboutProfile.update(id, profileData, req.file);
    
    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update about profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete about profile (admin only)
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if profile exists
    const profile = await AboutProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil tidak ditemukan'
      });
    }
    
    // Delete profile
    const success = await AboutProfile.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus profil'
      });
    }
    
    res.json({
      success: true,
      message: 'Profil berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete about profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};