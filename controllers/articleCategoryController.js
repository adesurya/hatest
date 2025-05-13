const ArticleCategory = require('../models/ArticleCategory');
const { validationResult } = require('express-validator');

// Get all article categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ArticleCategory.getAll();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get all article categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get article category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await ArticleCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori artikel tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get article category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get article category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await ArticleCategory.getBySlug(slug);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori artikel tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get article category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create article category (admin only)
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
    
    const newCategory = await ArticleCategory.create({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Kategori artikel berhasil dibuat',
      category: newCategory
    });
  } catch (error) {
    console.error('Create article category error:', error);
    
    if (error.message.includes('sudah ada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update article category (admin only)
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
    
    // Check if category exists
    const category = await ArticleCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori artikel tidak ditemukan'
      });
    }
    
    const success = await ArticleCategory.update(id, { name, description });
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate kategori artikel'
      });
    }
    
    // Get the updated category
    const updatedCategory = await ArticleCategory.getById(id);
    
    res.json({
      success: true,
      message: 'Kategori artikel berhasil diupdate',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update article category error:', error);
    
    if (error.message.includes('sudah ada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete article category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await ArticleCategory.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori artikel tidak ditemukan'
      });
    }
    
    try {
      const success = await ArticleCategory.delete(id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Gagal menghapus kategori artikel'
        });
      }
      
      res.json({
        success: true,
        message: 'Kategori artikel berhasil dihapus'
      });
    } catch (deleteError) {
      if (deleteError.message.includes('memiliki artikel terkait')) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak dapat dihapus karena memiliki artikel terkait'
        });
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error('Delete article category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};