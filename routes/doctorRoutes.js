const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const doctorValidation = require('../utils/doctorValidation');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Public
 */
router.get('/', doctorController.getAllDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id', doctorController.getDoctorById);

/**
 * @route   POST /api/doctors
 * @desc    Create new doctor (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  doctorController.uploadFiles,
  doctorValidation.createDoctorValidation,
  doctorController.createDoctor
);

/**
 * @route   PUT /api/doctors/:id
 * @desc    Update doctor (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  doctorController.uploadFiles,
  doctorValidation.updateDoctorValidation,
  doctorController.updateDoctor
);

/**
 * @route   PATCH /api/doctors/:id/verification
 * @desc    Update doctor verification status (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/verification',
  authenticate,
  isAdmin,
  doctorValidation.updateVerificationStatusValidation,
  doctorController.updateVerificationStatus
);

/**
 * @route   GET /api/doctors/:id/verification-history
 * @desc    Get doctor verification history (admin only)
 * @access  Private/Admin
 */
router.get(
  '/:id/verification-history',
  authenticate,
  isAdmin,
  doctorController.getVerificationHistory
);

/**
 * @route   DELETE /api/doctors/:id
 * @desc    Delete doctor (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  doctorController.deleteDoctor
);

module.exports = router;