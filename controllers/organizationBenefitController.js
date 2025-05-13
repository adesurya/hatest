const OrganizationBenefit = require('../models/OrganizationBenefit');
const { validationResult } = require('express-validator');

// Dapatkan semua manfaat organisasi
exports.getAllBenefits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const activeOnly = req.query.active === 'true';
    
    const options = {
      page,
      limit,
      activeOnly
    };
    
    const benefits = await OrganizationBenefit.getAll(options);
    const total = await OrganizationBenefit.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      benefits,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all organization benefits error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan manfaat organisasi berdasarkan ID
exports.getBenefitById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const benefit = await OrganizationBenefit.getById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Manfaat organisasi tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      benefit
    });
  } catch (error) {
    console.error('Get organization benefit by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat manfaat organisasi baru (admin only)
exports.createBenefit = async (req, res) => {
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
      icon,
      is_active,
      sort_order
    } = req.body;
    
    // Siapkan data manfaat organisasi
    const benefitData = {
      title,
      description,
      icon,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0,
      created_by: req.user.id
    };
    
    // Buat manfaat organisasi baru
    const newBenefit = await OrganizationBenefit.create(benefitData);
    
    res.status(201).json({
      success: true,
      message: 'Manfaat organisasi berhasil dibuat',
      benefit: newBenefit
    });
  } catch (error) {
    console.error('Create organization benefit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update manfaat organisasi (admin only)
exports.updateBenefit = async (req, res) => {
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
      icon,
      is_active,
      sort_order
    } = req.body;
    
    // Cek apakah manfaat organisasi ada
    const benefit = await OrganizationBenefit.getById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Manfaat organisasi tidak ditemukan'
      });
    }
    
    // Siapkan data update
    const benefitData = {
      title: title || benefit.title,
      description: description || benefit.description,
      icon: icon !== undefined ? icon : benefit.icon,
      is_active: is_active !== undefined ? is_active : benefit.is_active,
      sort_order: sort_order !== undefined ? sort_order : benefit.sort_order
    };
    
    // Update manfaat organisasi
    const success = await OrganizationBenefit.update(id, benefitData);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate manfaat organisasi'
      });
    }
    
    // Ambil data yang sudah diupdate
    const updatedBenefit = await OrganizationBenefit.getById(id);
    
    res.json({
      success: true,
      message: 'Manfaat organisasi berhasil diupdate',
      benefit: updatedBenefit
    });
  } catch (error) {
    console.error('Update organization benefit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus manfaat organisasi (admin only)
exports.deleteBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah manfaat organisasi ada
    const benefit = await OrganizationBenefit.getById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Manfaat organisasi tidak ditemukan'
      });
    }
    
    const success = await OrganizationBenefit.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus manfaat organisasi'
      });
    }
    
    res.json({
      success: true,
      message: 'Manfaat organisasi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete organization benefit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update status aktif manfaat organisasi (admin only)
exports.updateActiveStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Cek apakah manfaat organisasi ada
    const benefit = await OrganizationBenefit.getById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Manfaat organisasi tidak ditemukan'
      });
    }
    
    const success = await OrganizationBenefit.updateActiveStatus(id, is_active);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate status manfaat organisasi'
      });
    }
    
    res.json({
      success: true,
      message: `Manfaat organisasi berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (error) {
    console.error('Update organization benefit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update urutan manfaat organisasi (admin only)
exports.updateSortOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { sort_order } = req.body;
    
    // Cek apakah manfaat organisasi ada
    const benefit = await OrganizationBenefit.getById(id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Manfaat organisasi tidak ditemukan'
      });
    }
    
    const success = await OrganizationBenefit.updateSortOrder(id, sort_order);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate urutan manfaat organisasi'
      });
    }
    
    res.json({
      success: true,
      message: 'Urutan manfaat organisasi berhasil diupdate'
    });
  } catch (error) {
    console.error('Update organization benefit sort order error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};