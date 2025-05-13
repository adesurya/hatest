const express = require('express');
const router = express.Router();
const dokterMudaController = require('../controllers/dokterMudaController');
const dokterMudaValidation = require('../utils/dokterMudaValidation');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/dokter-muda
 * @desc    Get all dokter muda profiles
 * @access  Public/Private depending on filters
 */
router.get('/', dokterMudaController.getAllProfiles);

/**
 * @route   GET /api/dokter-muda/:id
 * @desc    Get dokter muda profile by ID
 * @access  Public
 */
router.get('/:id', dokterMudaController.getProfileById);

/**
 * @route   GET /api/dokter-muda/user/:user_id
 * @desc    Get dokter muda profile by user ID
 * @access  Public
 */
router.get('/user/:user_id', dokterMudaController.getProfileByUserId);

/**
 * @route   POST /api/dokter-muda
 * @desc    Create new dokter muda profile (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  dokterMudaController.uploadFiles,
  dokterMudaValidation.createProfileValidation,
  dokterMudaController.createProfile
);

/**
 * @route   PUT /api/dokter-muda/:id
 * @desc    Update dokter muda profile (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  dokterMudaController.uploadFiles,
  dokterMudaValidation.updateProfileValidation,
  dokterMudaController.updateProfile
);

/**
 * @route   PATCH /api/dokter-muda/:id/status
 * @desc    Update dokter muda verification status (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/status',
  authenticate,
  isAdmin,
  dokterMudaValidation.updateStatusValidation,
  dokterMudaController.updateStatusVerifikasi
);

/**
 * @route   DELETE /api/dokter-muda/:id
 * @desc    Delete dokter muda profile (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  dokterMudaController.deleteProfile
);

module.exports = router;