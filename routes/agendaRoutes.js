const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const { authenticate, isAdmin } = require('../middleware/auth');
const agendaValidation = require('../utils/agendaValidation');

/**
 * @route   GET /api/agenda
 * @desc    Get all agendas with pagination and filtering
 * @access  Public
 */
router.get('/', agendaController.getAllAgendas);

/**
 * @route   GET /api/agenda/:id
 * @desc    Get agenda by ID
 * @access  Public (but filters out unpublished for non-admin)
 */
router.get('/:id', agendaController.getAgendaById);

/**
 * @route   POST /api/agenda
 * @desc    Create new agenda (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  agendaController.uploadImage,
  agendaValidation.createAgendaValidation,
  agendaController.createAgenda
);

/**
 * @route   PUT /api/agenda/:id
 * @desc    Update agenda (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  agendaController.uploadImage,
  agendaValidation.updateAgendaValidation,
  agendaController.updateAgenda
);

/**
 * @route   DELETE /api/agenda/:id
 * @desc    Delete agenda (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  agendaController.deleteAgenda
);

/**
 * @route   PATCH /api/agenda/:id/publish
 * @desc    Toggle agenda publish status (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/publish',
  authenticate,
  isAdmin,
  agendaValidation.togglePublishValidation,
  agendaController.togglePublishStatus
);

module.exports = router;