const Testimonial = require('../models/Testimonial');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau SVG.'));
    }
  }
}).single('logo');

// Middleware for file upload
exports.uploadLogo = (req, res, next) => {
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

// Get all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const onlyActive = req.query.active === 'true';
    
    const options = {
      page,
      limit,
      onlyActive
    };
    
    const testimonials = await Testimonial.getAll(options);
    const total = await Testimonial.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      testimonials,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get testimonial by ID
exports.getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await Testimonial.getById(id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      testimonial
    });
  } catch (error) {
    console.error('Get testimonial by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create new testimonial (admin only)
exports.createTestimonial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      organization_name, 
      representative_name, 
      representative_position, 
      content, 
      rating, 
      is_active
    } = req.body;
    
    // Prepare testimonial data
    const testimonialData = {
      organization_name,
      representative_name,
      representative_position,
      content,
      rating: parseInt(rating),
      is_active: is_active === 'true',
      created_by: req.user.id
    };
    
    // Create new testimonial
    const newTestimonial = await Testimonial.create(testimonialData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Testimonial berhasil dibuat',
      testimonial: newTestimonial
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update testimonial (admin only)
exports.updateTestimonial = async (req, res) => {
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
      organization_name, 
      representative_name, 
      representative_position, 
      content, 
      rating, 
      is_active 
    } = req.body;
    
    // Check if testimonial exists
    const testimonial = await Testimonial.getById(id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial tidak ditemukan'
      });
    }
    
    // Prepare update data
    const testimonialData = {
      organization_name,
      representative_name,
      representative_position,
      content,
      rating: rating ? parseInt(rating) : undefined,
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    };
    
    // Update testimonial
    const updatedTestimonial = await Testimonial.update(id, testimonialData, req.file);
    
    res.json({
      success: true,
      message: 'Testimonial berhasil diupdate',
      testimonial: updatedTestimonial
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete testimonial (admin only)
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if testimonial exists
    const testimonial = await Testimonial.getById(id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial tidak ditemukan'
      });
    }
    
    const success = await Testimonial.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus testimonial'
      });
    }
    
    res.json({
      success: true,
      message: 'Testimonial berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Toggle testimonial active status (admin only)
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status aktif harus disertakan'
      });
    }
    
    // Check if testimonial exists
    const testimonial = await Testimonial.getById(id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial tidak ditemukan'
      });
    }
    
    const activeStatus = is_active === 'true';
    const success = await Testimonial.toggleActive(id, activeStatus);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengubah status testimonial'
      });
    }
    
    res.json({
      success: true,
      message: `Testimonial berhasil ${activeStatus ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (error) {
    console.error('Toggle testimonial status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};