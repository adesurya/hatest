const express = require('express');
const router = express.Router();
const kurikulumController = require('../controllers/kurikulumController');
const { authenticate, isAdmin } = require('../middleware/auth');
const kurikulumValidation = require('../utils/kurikulumValidation');

/**
 * @route   GET /api/kurikulum
 * @desc    Get all kurikulum with pagination
 * @access  Public
 */
router.get('/', kurikulumController.getAllKurikulum);

/**
 * @route   GET /api/kurikulum/:id
 * @desc    Get kurikulum by ID
 * @access  Public
 */
router.get('/:id', kurikulumController.getKurikulumById);

/**
 * @route   POST /api/kurikulum
 * @desc    Create new kurikulum (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  kurikulumController.uploadDocument,
  kurikulumValidation.createKurikulumValidation,
  kurikulumController.createKurikulum
);

/**
 * @route   PUT /api/kurikulum/:id
 * @desc    Update kurikulum (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  kurikulumController.uploadDocument,
  kurikulumValidation.updateKurikulumValidation,
  kurikulumController.updateKurikulum
);

/**
 * @route   DELETE /api/kurikulum/:id
 * @desc    Delete kurikulum (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  kurikulumController.deleteKurikulum
);

module.exports = router;