const OrganizationHistory = require('../models/OrganizationHistory');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk upload file
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
      cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, GIF, atau WEBP.'));
    }
  }
}).single('image');

// Middleware upload file
exports.uploadImage = (req, res, next) => {
  upload(req, res, (err) => {
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

// Dapatkan semua sejarah organisasi
exports.getAllHistories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Jika user tidak login atau bukan admin, tampilkan yang aktif saja
    const publicView = !req.user || !req.user.is_admin;
    
    const options = {
      page,
      limit,
      publicView
    };
    
    const histories = await OrganizationHistory.getAll(options);
    const total = await OrganizationHistory.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      histories,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all organization histories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan sejarah organisasi berdasarkan ID
exports.getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await OrganizationHistory.getById(id);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Sejarah organisasi tidak ditemukan'
      });
    }
    
    // Jika user tidak login atau bukan admin, cek apakah sejarah aktif
    if ((!req.user || !req.user.is_admin) && !history.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Sejarah organisasi tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get organization history by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat sejarah organisasi baru (admin only)
exports.createHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { title, content, year, is_active } = req.body;
    
    // Persiapkan data sejarah
    const historyData = {
      title,
      content,
      year,
      is_active: is_active === 'true' || is_active === true,
      created_by: req.user.id
    };
    
    // Buat sejarah baru
    const newHistory = await OrganizationHistory.create(historyData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Sejarah organisasi berhasil dibuat',
      history: newHistory
    });
  } catch (error) {
    console.error('Create organization history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update sejarah organisasi (admin only)
exports.updateHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { title, content, year, is_active } = req.body;
    
    // Cek apakah sejarah ada
    const history = await OrganizationHistory.getById(id);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Sejarah organisasi tidak ditemukan'
      });
    }
    
    // Persiapkan data update
    const historyData = {
      title,
      content,
      year,
      is_active: is_active === 'true' || is_active === true
    };
    
    // Update sejarah
    const updatedHistory = await OrganizationHistory.update(id, historyData, req.file);
    
    res.json({
      success: true,
      message: 'Sejarah organisasi berhasil diupdate',
      history: updatedHistory
    });
  } catch (error) {
    console.error('Update organization history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus sejarah organisasi (admin only)
exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah sejarah ada
    const history = await OrganizationHistory.getById(id);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Sejarah organisasi tidak ditemukan'
      });
    }
    
    const success = await OrganizationHistory.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus sejarah organisasi'
      });
    }
    
    res.json({
      success: true,
      message: 'Sejarah organisasi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete organization history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};