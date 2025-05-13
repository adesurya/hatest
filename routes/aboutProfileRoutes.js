const express = require('express');
const router = express.Router();
const aboutProfileController = require('../controllers/aboutProfileController');
const { authenticate, isAdmin } = require('../middleware/auth');
const aboutProfileValidation = require('../utils/aboutProfileValidation');

/**
 * @route   GET /api/about-profiles
 * @desc    Get all about profiles
 * @access  Public
 */
router.get('/', aboutProfileController.getAllProfiles);

/**
 * @route   GET /api/about-profiles/:id
 * @desc    Get about profile by ID
 * @access  Public
 */
router.get('/:id', aboutProfileController.getProfileById);

/**
 * @route   POST /api/about-profiles
 * @desc    Create new about profile (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  aboutProfileController.uploadImage,
  aboutProfileValidation.createProfileValidation,
  aboutProfileController.createProfile
);

/**
 * @route   PUT /api/about-profiles/:id
 * @desc    Update about profile (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  aboutProfileController.uploadImage,
  aboutProfileValidation.updateProfileValidation,
  aboutProfileController.updateProfile
);

/**
 * @route   DELETE /api/about-profiles/:id
 * @desc    Delete about profile (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  aboutProfileController.deleteProfile
);

module.exports = router;