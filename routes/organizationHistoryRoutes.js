const express = require('express');
const router = express.Router();
const organizationHistoryController = require('../controllers/organizationHistoryController');
const { authenticate, isAdmin } = require('../middleware/auth');
const organizationHistoryValidation = require('../utils/organizationHistoryValidation');

/**
 * @route   GET /api/organization-history
 * @desc    Get all organization histories
 * @access  Public
 */
router.get('/', organizationHistoryController.getAllHistories);

/**
 * @route   GET /api/organization-history/:id
 * @desc    Get organization history by ID
 * @access  Public
 */
router.get('/:id', organizationHistoryController.getHistoryById);

/**
 * @route   POST /api/organization-history
 * @desc    Create new organization history (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  organizationHistoryController.uploadImage,
  organizationHistoryValidation.createHistoryValidation,
  organizationHistoryController.createHistory
);

/**
 * @route   PUT /api/organization-history/:id
 * @desc    Update organization history (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  organizationHistoryController.uploadImage,
  organizationHistoryValidation.updateHistoryValidation,
  organizationHistoryController.updateHistory
);

/**
 * @route   DELETE /api/organization-history/:id
 * @desc    Delete organization history (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  organizationHistoryController.deleteHistory
);

module.exports = router;