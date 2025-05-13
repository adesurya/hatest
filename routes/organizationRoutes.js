const express = require('express');
const router = express.Router();
const organizationStructureController = require('../controllers/organizationStructureController');
const { authenticate, isAdmin } = require('../middleware/auth');
const organizationStructureValidation = require('../utils/organizationStructureValidation');

/**
 * @route   GET /api/organization/structure
 * @desc    Get all organization structures
 * @access  Public
 */
router.get('/structure', organizationStructureController.getAllStructures);

/**
 * @route   GET /api/organization/structure/active
 * @desc    Get all active organization structures
 * @access  Public
 */
router.get('/structure/active', organizationStructureController.getActiveStructures);

/**
 * @route   GET /api/organization/structure/:id
 * @desc    Get organization structure by ID
 * @access  Public
 */
router.get('/structure/:id', organizationStructureController.getStructureById);

/**
 * @route   POST /api/organization/structure
 * @desc    Create new organization structure (admin only)
 * @access  Private/Admin
 */
router.post(
  '/structure',
  authenticate,
  isAdmin,
  organizationStructureController.uploadImage,
  organizationStructureValidation.createStructureValidation,
  organizationStructureController.createStructure
);

/**
 * @route   PUT /api/organization/structure/:id
 * @desc    Update organization structure (admin only)
 * @access  Private/Admin
 */
router.put(
  '/structure/:id',
  authenticate,
  isAdmin,
  organizationStructureController.uploadImage,
  organizationStructureValidation.updateStructureValidation,
  organizationStructureController.updateStructure
);

/**
 * @route   DELETE /api/organization/structure/:id
 * @desc    Delete organization structure (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/structure/:id',
  authenticate,
  isAdmin,
  organizationStructureController.deleteStructure
);

module.exports = router;