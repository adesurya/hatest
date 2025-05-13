const Article = require('../models/Article');
const ArticleCategory = require('../models/ArticleCategory');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
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
}).single('featured_image');

// Middleware for file upload
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

// Get all articles (with pagination and filters)
exports.getAllArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const categoryId = req.query.category;
    const search = req.query.search;
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder;
    
    const options = {
      page,
      limit,
      status,
      categoryId,
      search,
      sortBy,
      sortOrder
    };
    
    // If user is not admin, only show published articles
    if (!req.user || !req.user.is_admin) {
      options.status = 'published';
    }
    
    const articles = await Article.getAll(options);
    const total = await Article.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      articles,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.getById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // If article is not published and user is not admin, return 404
    if (article.status !== 'published' && (!req.user || !req.user.is_admin)) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Get article by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get article by slug
exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const article = await Article.getBySlug(slug);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // If article is not published and user is not admin, return 404
    if (article.status !== 'published' && (!req.user || !req.user.is_admin)) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Get article by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create article (admin only)
exports.createArticle = async (req, res) => {
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
      content, 
      excerpt, 
      category_id, 
      status 
    } = req.body;
    
    // Check if category exists
    const category = await ArticleCategory.getById(category_id);
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Kategori artikel tidak valid'
      });
    }
    
    // Prepare article data
    const articleData = {
      title,
      content,
      excerpt,
      category_id,
      status,
      created_by: req.user.id
    };
    
    // Create new article
    const newArticle = await Article.create(articleData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Artikel berhasil dibuat',
      article: newArticle
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update article (admin only)
exports.updateArticle = async (req, res) => {
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
      content, 
      excerpt, 
      category_id, 
      status 
    } = req.body;
    
    // Check if article exists
    const article = await Article.getById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Check if category is valid
    if (category_id) {
      const category = await ArticleCategory.getById(category_id);
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Kategori artikel tidak valid'
        });
      }
    }
    
    // Prepare update data
    const articleData = {
      title,
      content,
      excerpt,
      category_id,
      status
    };
    
    // Update article
    const updatedArticle = await Article.update(id, articleData, req.file);
    
    res.json({
      success: true,
      message: 'Artikel berhasil diupdate',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete article (admin only)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if article exists
    const article = await Article.getById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    const success = await Article.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus artikel'
      });
    }
    
    res.json({
      success: true,
      message: 'Artikel berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get latest articles
exports.getLatestArticles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const articles = await Article.getLatest(limit);
    
    res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Get latest articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Check if category exists
    const category = await ArticleCategory.getById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori artikel tidak ditemukan'
      });
    }
    
    const options = { page, limit };
    
    const articles = await Article.getByCategory(categoryId, options);
    const total = await Article.countTotal({ categoryId, status: 'published' });
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      category,
      articles,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get articles by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};