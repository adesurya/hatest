const OrganizationStructure = require('../models/OrganizationStructure');
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
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, GIF, atau SVG.'));
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

// Dapatkan semua struktur organisasi
exports.getAllStructures = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isActive = req.query.active === 'true' ? true : (req.query.active === 'false' ? false : undefined);
    
    const options = {
      page,
      limit,
      isActive
    };
    
    const structures = await OrganizationStructure.getAll(options);
    const total = await OrganizationStructure.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      structures,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all organization structures error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan struktur organisasi berdasarkan ID
exports.getStructureById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const structure = await OrganizationStructure.getById(id);
    
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      structure
    });
  } catch (error) {
    console.error('Get organization structure by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat struktur organisasi baru (admin only)
exports.createStructure = async (req, res) => {
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
      position, 
      is_active 
    } = req.body;
    
    const structureData = {
      title,
      description,
      position: position ? parseInt(position) : 0,
      is_active: is_active === 'true' || is_active === true,
      created_by: req.user.id
    };
    
    const newStructure = await OrganizationStructure.create(structureData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Struktur organisasi berhasil dibuat',
      structure: newStructure
    });
  } catch (error) {
    console.error('Create organization structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update struktur organisasi (admin only)
exports.updateStructure = async (req, res) => {
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
      position, 
      is_active 
    } = req.body;
    
    // Cek apakah struktur organisasi ada
    const structure = await OrganizationStructure.getById(id);
    
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }
    
    // Persiapkan data update
    const structureData = {
      title,
      description,
      position: position !== undefined ? parseInt(position) : undefined,
      is_active: is_active === 'true' ? true : (is_active === 'false' ? false : undefined)
    };
    
    // Update struktur organisasi
    const updatedStructure = await OrganizationStructure.update(id, structureData, req.file);
    
    res.json({
      success: true,
      message: 'Struktur organisasi berhasil diupdate',
      structure: updatedStructure
    });
  } catch (error) {
    console.error('Update organization structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus struktur organisasi (admin only)
exports.deleteStructure = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah struktur organisasi ada
    const structure = await OrganizationStructure.getById(id);
    
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }
    
    const success = await OrganizationStructure.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus struktur organisasi'
      });
    }
    
    res.json({
      success: true,
      message: 'Struktur organisasi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete organization structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan struktur organisasi aktif (public)
exports.getActiveStructures = async (req, res) => {
  try {
    const options = {
      isActive: true
    };
    
    const structures = await OrganizationStructure.getAll(options);
    
    res.json({
      success: true,
      structures
    });
  } catch (error) {
    console.error('Get active organization structures error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};