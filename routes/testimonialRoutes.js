const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { authenticate, isAdmin } = require('../middleware/auth');
const testimonialValidation = require('../utils/testimonialValidation');

/**
 * @route   GET /api/testimonials
 * @desc    Get all testimonials
 * @access  Public
 */
router.get('/', testimonialController.getAllTestimonials);

/**
 * @route   GET /api/testimonials/:id
 * @desc    Get testimonial by ID
 * @access  Public
 */
router.get('/:id', testimonialController.getTestimonialById);

/**
 * @route   POST /api/testimonials
 * @desc    Create new testimonial (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  testimonialController.uploadLogo,
  testimonialValidation.createTestimonialValidation,
  testimonialController.createTestimonial
);

/**
 * @route   PUT /api/testimonials/:id
 * @desc    Update testimonial (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  testimonialController.uploadLogo,
  testimonialValidation.updateTestimonialValidation,
  testimonialController.updateTestimonial
);

/**
 * @route   DELETE /api/testimonials/:id
 * @desc    Delete testimonial (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  testimonialController.deleteTestimonial
);

/**
 * @route   PATCH /api/testimonials/:id/toggle-active
 * @desc    Toggle testimonial active status (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  isAdmin,
  testimonialController.toggleActiveStatus
);

module.exports = router;