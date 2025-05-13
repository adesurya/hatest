const express = require('express');
const router = express.Router();
const visionMissionController = require('../controllers/visionMissionController');
const { authenticate, isAdmin } = require('../middleware/auth');
const visionMissionValidation = require('../utils/visionMissionValidation');

/**
 * @route   GET /api/vision-mission
 * @desc    Get all vision and mission items
 * @access  Public
 */
router.get('/', visionMissionController.getAllItems);

/**
 * @route   GET /api/vision-mission/:id
 * @desc    Get vision and mission item by ID
 * @access  Public
 */
router.get('/:id', visionMissionController.getItemById);

/**
 * @route   POST /api/vision-mission
 * @desc    Create a new vision or mission item (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  visionMissionValidation.createItemValidation,
  visionMissionController.createItem
);

/**
 * @route   PUT /api/vision-mission/:id
 * @desc    Update a vision or mission item (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  visionMissionValidation.updateItemValidation,
  visionMissionController.updateItem
);

/**
 * @route   DELETE /api/vision-mission/:id
 * @desc    Delete a vision or mission item (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  visionMissionController.deleteItem
);

/**
 * @route   PATCH /api/vision-mission/:id/toggle-active
 * @desc    Toggle active status of a vision or mission item (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  isAdmin,
  visionMissionValidation.toggleActiveValidation,
  visionMissionController.toggleActive
);

module.exports = router;