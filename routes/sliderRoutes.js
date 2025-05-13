const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const sliderValidation = require('../utils/sliderValidation');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/sliders/active
 * @desc    Get active sliders for frontend
 * @access  Public
 */
router.get('/active', sliderController.getActiveSliders);

/**
 * @route   GET /api/sliders
 * @desc    Get all sliders
 * @access  Private/Admin
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  sliderController.getAllSliders
);

/**
 * @route   GET /api/sliders/:id
 * @desc    Get slider by ID
 * @access  Private/Admin
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  sliderController.getSliderById
);

/**
 * @route   POST /api/sliders
 * @desc    Create new slider
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  sliderController.uploadImage,
  sliderValidation.createSliderValidation,
  sliderController.createSlider
);

/**
 * @route   PUT /api/sliders/:id
 * @desc    Update slider
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  sliderController.uploadImage,
  sliderValidation.updateSliderValidation,
  sliderController.updateSlider
);

/**
 * @route   DELETE /api/sliders/:id
 * @desc    Delete slider
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  sliderController.deleteSlider
);

/**
 * @route   PATCH /api/sliders/:id/toggle-active
 * @desc    Toggle slider active status
 * @access  Private/Admin
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  isAdmin,
  sliderValidation.toggleActiveValidation,
  sliderController.toggleActive
);

module.exports = router;