// File: routes/authRoutes.js (Update for Register)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validation = require('../utils/validation');
const userController = require('../controllers/userController'); // Import untuk middleware upload

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with photo upload support
 * @access  Public
 */
router.post(
  '/register', 
  userController.uploadProfilePhotos, // Middleware untuk upload foto
  validation.registerValidation, 
  authController.register
);

/**
 * @route   GET /api/auth/verify/:token
 * @desc    Verify user account
 * @access  Public
 */
router.get('/verify/:token', authController.verifyAccount);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validation.loginValidation, authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Forgot password
 * @access  Public
 */
router.post('/forgot-password', validation.forgotPasswordValidation, authController.forgotPassword);

/**
 * @route   GET /api/auth/reset-password/:token
 * @desc    Verify reset password token
 * @access  Public
 */
router.get('/reset-password/:token', authController.verifyResetToken);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', validation.resetPasswordValidation, authController.resetPassword);

module.exports = router;