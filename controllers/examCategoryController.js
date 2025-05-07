const ExamCategory = require('../models/ExamCategory');
const { validationResult } = require('express-validator');

// Dapatkan semua kategori ujian
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ExamCategory.getAll();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get all exam categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan kategori ujian berdasarkan ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await ExamCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori ujian tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get exam category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat kategori ujian baru (admin only)
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, description } = req.body;
    
    const newCategory = await ExamCategory.create({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Kategori ujian berhasil dibuat',
      category: newCategory
    });
  } catch (error) {
    console.error('Create exam category error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori ujian sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update kategori ujian (admin only)
exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Cek apakah kategori ada
    const category = await ExamCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori ujian tidak ditemukan'
      });
    }
    
    const success = await ExamCategory.update(id, { name, description });
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate kategori ujian'
      });
    }
    
    // Ambil kategori yang sudah diupdate
    const updatedCategory = await ExamCategory.getById(id);
    
    res.json({
      success: true,
      message: 'Kategori ujian berhasil diupdate',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update exam category error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori ujian sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus kategori ujian (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah kategori ada
    const category = await ExamCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori ujian tidak ditemukan'
      });
    }
    
    try {
      const success = await ExamCategory.delete(id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Gagal menghapus kategori ujian'
        });
      }
      
      res.json({
        success: true,
        message: 'Kategori ujian berhasil dihapus'
      });
    } catch (deleteError) {
      if (deleteError.message.includes('memiliki ujian terkait')) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak dapat dihapus karena memiliki ujian terkait'
        });
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error('Delete exam category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};