const { body } = require('express-validator');

// Validation for creating an event
exports.createEventValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isLength({ min: 5, max: 200 }).withMessage('Event name must be between 5-200 characters'),
    
  body('description')
    .trim()
    .notEmpty().withMessage('Event description is required'),
    
  body('event_date')
    .trim()
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid event date format'),
    
  body('fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fee must be a positive number or zero'),
    
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 5, max: 255 }).withMessage('Location must be between 5-255 characters'),
    
  body('points')
    .optional()
    .isInt({ min: 0 }).withMessage('Points must be a positive integer or zero')
  
  // Note: File validations are handled by multer middleware
];

// Validation for updating an event
exports.updateEventValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Event name must be between 5-200 characters'),
    
  body('description')
    .optional()
    .trim(),
    
  body('event_date')
    .optional()
    .trim()
    .isISO8601().withMessage('Invalid event date format'),
    
  body('fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fee must be a positive number or zero'),
    
  body('location')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage('Location must be between 5-255 characters'),
    
  body('points')
    .optional()
    .isInt({ min: 0 }).withMessage('Points must be a positive integer or zero'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value')
];

// Validation for adding points
exports.addPointsValidation = [
  body('user_id')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isInt().withMessage('User ID must be an integer'),
    
  body('event_id')
    .trim()
    .notEmpty().withMessage('Event ID is required')
    .isInt().withMessage('Event ID must be an integer'),
    
  body('points')
    .trim()
    .notEmpty().withMessage('Points value is required')
    .isInt({ min: 0 }).withMessage('Points must be a positive integer or zero'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Notes must be less than 255 characters')
];