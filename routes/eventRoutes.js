const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const userPointsController = require('../controllers/userPointsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const eventValidation = require('../utils/eventValidation');

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Public
 */
router.get('/', eventController.getAllEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Public
 */
router.get('/:id', eventController.getEventById);

/**
 * @route   POST /api/events
 * @desc    Create new event (admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  eventController.uploadDocuments,
  eventValidation.createEventValidation,
  eventController.createEvent
);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  eventController.uploadDocuments,
  eventValidation.updateEventValidation,
  eventController.updateEvent
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  eventController.deleteEvent
);

/**
 * @route   POST /api/events/:id/register
 * @desc    Register for an event
 * @access  Private
 */
router.post(
  '/:id/register',
  authenticate,
  eventController.registerEvent
);

/**
 * @route   GET /api/events/user/registrations
 * @desc    Get user's event registrations
 * @access  Private
 */
router.get(
  '/user/registrations',
  authenticate,
  eventController.getUserEventRegistrations
);

/**
 * @route   GET /api/events/:eventId/registrations
 * @desc    Get event registrations (admin only)
 * @access  Private/Admin
 */
router.get(
  '/:eventId/registrations',
  authenticate,
  isAdmin,
  eventController.getEventRegistrations
);

/**
 * @route   POST /api/events/registrations/:id/mark-attended
 * @desc    Mark user as attended (admin only)
 * @access  Private/Admin
 */
router.post(
  '/registrations/:id/mark-attended',
  authenticate,
  isAdmin,
  eventController.markAttended
);

/**
 * @route   GET /api/events/points/user
 * @desc    Get current user's points
 * @access  Private
 */
router.get(
  '/points/user',
  authenticate,
  userPointsController.getUserPoints
);

/**
 * @route   GET /api/events/points/user/:userId
 * @desc    Get user points by userId (admin only)
 * @access  Private/Admin
 */
router.get(
  '/points/user/:userId',
  authenticate,
  isAdmin,
  userPointsController.getUserPoints
);

/**
 * @route   POST /api/events/points
 * @desc    Add points to user (admin only)
 * @access  Private/Admin
 */
router.post(
  '/points',
  authenticate,
  isAdmin,
  eventValidation.addPointsValidation,
  userPointsController.addPoints
);

/**
 * @route   DELETE /api/events/points/:id
 * @desc    Delete points record (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/points/:id',
  authenticate,
  isAdmin,
  userPointsController.deletePoints
);

/**
 * @route   GET /api/events/points/leaderboard
 * @desc    Get points leaderboard
 * @access  Public
 */
router.get(
  '/points/leaderboard',
  userPointsController.getLeaderboard
);

module.exports = router;