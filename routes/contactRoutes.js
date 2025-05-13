const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, isAdmin } = require('../middleware/auth');
const contactValidation = require('../utils/contactValidation');

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts
 * @access  Public
 */
router.get('/', contactController.getAllContacts);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Public
 */
router.get('/:id', contactController.getContactById);

/**
 * @route   POST /api/contacts
 * @desc    Create new contact (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  contactValidation.createContactValidation,
  contactController.createContact
);

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  contactValidation.updateContactValidation,
  contactController.updateContact
);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  contactController.deleteContact
);

module.exports = router;