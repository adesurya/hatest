const express = require('express');
const router = express.Router();
const articleCategoryController = require('../controllers/articleCategoryController');
const articleController = require('../controllers/articleController');
const { authenticate, isAdmin } = require('../middleware/auth');
const articleValidation = require('../utils/articleValidation');

// Article Category Routes
// Public routes
/**
 * @route   GET /api/articles/categories
 * @desc    Get all article categories
 * @access  Public
 */
router.get('/categories', articleCategoryController.getAllCategories);

/**
 * @route   GET /api/articles/categories/:id
 * @desc    Get article category by ID
 * @access  Public
 */
router.get('/categories/:id', articleCategoryController.getCategoryById);

/**
 * @route   GET /api/articles/categories/slug/:slug
 * @desc    Get article category by slug
 * @access  Public
 */
router.get('/categories/slug/:slug', articleCategoryController.getCategoryBySlug);

// Admin routes
/**
 * @route   POST /api/articles/categories
 * @desc    Create new article category (admin only)
 * @access  Private/Admin
 */
router.post(
  '/categories',
  authenticate,
  isAdmin,
  articleValidation.createCategoryValidation,
  articleCategoryController.createCategory
);

/**
 * @route   PUT /api/articles/categories/:id
 * @desc    Update article category (admin only)
 * @access  Private/Admin
 */
router.put(
  '/categories/:id',
  authenticate,
  isAdmin,
  articleValidation.updateCategoryValidation,
  articleCategoryController.updateCategory
);

/**
 * @route   DELETE /api/articles/categories/:id
 * @desc    Delete article category (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/categories/:id',
  authenticate,
  isAdmin,
  articleCategoryController.deleteCategory
);

// Article Routes
// Public routes
/**
 * @route   GET /api/articles
 * @desc    Get all articles (public sees only published, admin sees all)
 * @access  Public/Private
 */
router.get('/', articleController.getAllArticles);

/**
 * @route   GET /api/articles/latest
 * @desc    Get latest published articles
 * @access  Public
 */
router.get('/latest', articleController.getLatestArticles);

/**
 * @route   GET /api/articles/category/:categoryId
 * @desc    Get articles by category
 * @access  Public
 */
router.get('/category/:categoryId', articleController.getArticlesByCategory);

/**
 * @route   GET /api/articles/:id
 * @desc    Get article by ID
 * @access  Public (for published) / Private (for draft/archived)
 */
router.get('/:id', articleController.getArticleById);

/**
 * @route   GET /api/articles/slug/:slug
 * @desc    Get article by slug
 * @access  Public (for published) / Private (for draft/archived)
 */
router.get('/slug/:slug', articleController.getArticleBySlug);

// Admin routes
/**
 * @route   POST /api/articles
 * @desc    Create new article (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  articleController.uploadImage,
  articleValidation.createArticleValidation,
  articleController.createArticle
);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  articleController.uploadImage,
  articleValidation.updateArticleValidation,
  articleController.updateArticle
);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete article (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  articleController.deleteArticle
);

module.exports = router;