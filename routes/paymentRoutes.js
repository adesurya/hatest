const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');
const examValidation = require('../utils/examValidation');

/**
 * @route   GET /api/payments/methods
 * @desc    Get all active payment methods
 * @access  Private
 */
router.get('/methods', authenticate, paymentController.getPaymentMethods);

/**
 * @route   POST /api/payments/transaction
 * @desc    Create payment transaction
 * @access  Private
 */
router.post(
  '/transaction',
  authenticate,
  examValidation.createTransactionValidation,
  paymentController.createTransaction
);

/**
 * @route   GET /api/payments/user
 * @desc    Get user's payment transactions
 * @access  Private
 */
router.get('/user', authenticate, paymentController.getUserTransactions);

/**
 * @route   GET /api/payments/:id/detail
 * @desc    Get payment detail for receipt
 * @access  Private
 */
router.get('/:id/detail', authenticate, paymentController.getPaymentDetail);

/**
 * @route   POST /api/payments/check
 * @desc    Check payment status
 * @access  Private
 */
router.post(
  '/check',
  authenticate,
  examValidation.checkTransactionValidation,
  paymentController.checkTransaction
);

/**
 * @route   POST /api/payments/callback
 * @desc    Payment gateway callback (Duitku)
 * @access  Public
 */
router.post('/callback', paymentController.callbackPayment);

/**
 * @route   GET /api/payments/admin/transactions
 * @desc    Get all transactions (admin only)
 * @access  Private/Admin
 */
router.get(
  '/admin/transactions',
  authenticate,
  isAdmin,
  paymentController.getAllTransactions
);

module.exports = router;