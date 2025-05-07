const express = require('express');
const router = express.Router();
const examCategoryController = require('../controllers/examCategoryController');
const examController = require('../controllers/examController');
const { authenticate, isAdmin } = require('../middleware/auth');
const examValidation = require('../utils/examValidation');

/**
 * @route   GET /api/exams/categories
 * @desc    Get all exam categories
 * @access  Public
 */
router.get('/categories', examCategoryController.getAllCategories);

/**
 * @route   GET /api/exams/categories/:id
 * @desc    Get exam category by ID
 * @access  Public
 */
router.get('/categories/:id', examCategoryController.getCategoryById);

/**
 * @route   POST /api/exams/categories
 * @desc    Create new exam category (admin only)
 * @access  Private/Admin
 */
router.post(
  '/categories',
  authenticate,
  isAdmin,
  examValidation.createCategoryValidation,
  examCategoryController.createCategory
);

/**
 * @route   PUT /api/exams/categories/:id
 * @desc    Update exam category (admin only)
 * @access  Private/Admin
 */
router.put(
  '/categories/:id',
  authenticate,
  isAdmin,
  examValidation.updateCategoryValidation,
  examCategoryController.updateCategory
);

/**
 * @route   DELETE /api/exams/categories/:id
 * @desc    Delete exam category (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/categories/:id',
  authenticate,
  isAdmin,
  examCategoryController.deleteCategory
);

/**
 * @route   GET /api/exams
 * @desc    Get all exams
 * @access  Public
 */
router.get('/', examController.getAllExams);

/**
 * @route   GET /api/exams/:id
 * @desc    Get exam by ID
 * @access  Public
 */
router.get('/:id', examController.getExamById);

/**
 * @route   POST /api/exams
 * @desc    Create new exam (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  examController.uploadDocument,
  examValidation.createExamValidation,
  examController.createExam
);

/**
 * @route   PUT /api/exams/:id
 * @desc    Update exam (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  examController.uploadDocument,
  examValidation.updateExamValidation,
  examController.updateExam
);

/**
 * @route   DELETE /api/exams/:id
 * @desc    Delete exam (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  examController.deleteExam
);

/**
 * @route   POST /api/exams/:id/register
 * @desc    Register for an exam
 * @access  Private
 */
router.post(
  '/:id/register',
  authenticate,
  examController.registerExam
);

/**
 * @route   GET /api/exams/user/registrations
 * @desc    Get user's exam registrations
 * @access  Private
 */
router.get(
  '/user/registrations',
  authenticate,
  examController.getUserExamRegistrations
);

module.exports = router;