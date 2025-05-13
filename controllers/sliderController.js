const Slider = require('../models/Slider');
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

// Dapatkan semua slider (untuk admin)
exports.getAllSliders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isActive = req.query.is_active !== undefined ? 
      req.query.is_active === 'true' : undefined;
    
    const options = {
      page,
      limit,
      isActive
    };
    
    const sliders = await Slider.getAll(options);
    const total = await Slider.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      sliders,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all sliders error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan slider berdasarkan ID
exports.getSliderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const slider = await Slider.getById(id);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      slider
    });
  } catch (error) {
    console.error('Get slider by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat slider baru (admin only)
exports.createSlider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Gambar slider wajib diupload'
      });
    }
    
    const { title, description, is_active, order_number } = req.body;
    
    // Persiapkan data slider
    const sliderData = {
      title,
      description,
      is_active: is_active === 'true',
      order_number: order_number ? parseInt(order_number) : 0,
      created_by: req.user.id
    };
    
    // Buat slider baru
    const newSlider = await Slider.create(sliderData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Slider berhasil dibuat',
      slider: newSlider
    });
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update slider (admin only)
exports.updateSlider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { title, description, is_active, order_number } = req.body;
    
    // Cek apakah slider ada
    const slider = await Slider.getById(id);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider tidak ditemukan'
      });
    }
    
    // Persiapkan data update
    const sliderData = {
      title,
      description,
      is_active: is_active !== undefined ? is_active === 'true' : slider.is_active,
      order_number: order_number !== undefined ? parseInt(order_number) : slider.order_number
    };
    
    // Update slider
    const updatedSlider = await Slider.update(id, sliderData, req.file);
    
    res.json({
      success: true,
      message: 'Slider berhasil diupdate',
      slider: updatedSlider
    });
  } catch (error) {
    console.error('Update slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus slider (admin only)
exports.deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah slider ada
    const slider = await Slider.getById(id);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider tidak ditemukan'
      });
    }
    
    const success = await Slider.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus slider'
      });
    }
    
    res.json({
      success: true,
      message: 'Slider berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Ubah status aktif slider (admin only)
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status aktif (is_active) wajib diisi'
      });
    }
    
    // Cek apakah slider ada
    const slider = await Slider.getById(id);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider tidak ditemukan'
      });
    }
    
    const isActive = is_active === 'true' || is_active === true;
    
    const success = await Slider.toggleActive(id, isActive);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengubah status slider'
      });
    }
    
    res.json({
      success: true,
      message: `Slider berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (error) {
    console.error('Toggle active slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan slider aktif untuk frontend (public)
exports.getActiveSliders = async (req, res) => {
  try {
    const sliders = await Slider.getActiveSliders();
    
    res.json({
      success: true,
      sliders
    });
  } catch (error) {
    console.error('Get active sliders error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};