const express = require('express');
const router = express.Router();
const medicalFacultyController = require('../controllers/medicalFacultyController');
const medicalFacultyValidation = require('../utils/medicalFacultyValidation');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/medical-faculties
 * @desc    Get all medical faculties
 * @access  Public/Private (Users & Admin)
 */
router.get('/', medicalFacultyController.getAllFaculties);

/**
 * @route   GET /api/medical-faculties/:id
 * @desc    Get medical faculty by ID
 * @access  Public/Private (Users & Admin)
 */
router.get('/:id', medicalFacultyController.getFacultyById);

/**
 * @route   POST /api/medical-faculties
 * @desc    Create new medical faculty (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  medicalFacultyValidation.createFacultyValidation,
  medicalFacultyController.createFaculty
);

/**
 * @route   PUT /api/medical-faculties/:id
 * @desc    Update medical faculty (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  medicalFacultyValidation.updateFacultyValidation,
  medicalFacultyController.updateFaculty
);

/**
 * @route   DELETE /api/medical-faculties/:id
 * @desc    Delete medical faculty (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  medicalFacultyController.deleteFaculty
);

module.exports = router;