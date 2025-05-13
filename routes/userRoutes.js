// File: routes/userRoutes.js (FIXED)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { canAccessProfile, canViewProfile } = require('../middleware/profileAccess');
const validation = require('../utils/validation');

/**
 * @route   GET /api/users/profile
 * @desc    Get logged in user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile', 
  authenticate, 
  userController.uploadProfilePhotos,
  validation.updateProfileValidation, 
  userController.updateProfile
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validation.changePasswordValidation, userController.changePassword);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, isAdmin, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by id (admin can access any user, regular user can only access their own profile)
 * @access  Private
 */
router.get('/:id', authenticate, canViewProfile, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile by id (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id', 
  authenticate, 
  isAdmin,
  userController.uploadProfilePhotos,
  validation.adminUpdateProfileValidation, 
  userController.updateUserById // Pastikan fungsi ini ada di userController
);

module.exports = router;