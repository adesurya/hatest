const express = require('express');
const router = express.Router();
const organizationBenefitController = require('../controllers/organizationBenefitController');
const organizationBenefitValidation = require('../utils/organizationBenefitValidation');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/benefits
 * @desc    Get all organization benefits
 * @access  Public
 */
router.get('/', organizationBenefitController.getAllBenefits);

/**
 * @route   GET /api/benefits/:id
 * @desc    Get organization benefit by ID
 * @access  Public
 */
router.get('/:id', organizationBenefitController.getBenefitById);

/**
 * @route   POST /api/benefits
 * @desc    Create new organization benefit (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  organizationBenefitValidation.createBenefitValidation,
  organizationBenefitController.createBenefit
);

/**
 * @route   PUT /api/benefits/:id
 * @desc    Update organization benefit (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  organizationBenefitValidation.updateBenefitValidation,
  organizationBenefitController.updateBenefit
);

/**
 * @route   DELETE /api/benefits/:id
 * @desc    Delete organization benefit (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  organizationBenefitController.deleteBenefit
);

/**
 * @route   PATCH /api/benefits/:id/status
 * @desc    Update organization benefit active status (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/status',
  authenticate,
  isAdmin,
  organizationBenefitValidation.updateStatusValidation,
  organizationBenefitController.updateActiveStatus
);

/**
 * @route   PATCH /api/benefits/:id/sort-order
 * @desc    Update organization benefit sort order (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/sort-order',
  authenticate,
  isAdmin,
  organizationBenefitValidation.updateSortOrderValidation,
  organizationBenefitController.updateSortOrder
);

module.exports = router;