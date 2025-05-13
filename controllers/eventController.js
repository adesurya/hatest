const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const UserPoints = require('../models/UserPoints');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File format not supported. Use PDF, DOC, DOCX, JPG, JPEG, or PNG.'));
    }
  }
}).fields([
  { name: 'supporting_document', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Middleware for file upload
exports.uploadDocuments = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isActive = req.query.active === 'true' ? true : 
                    req.query.active === 'false' ? false : undefined;
    const upcoming = req.query.upcoming === 'true';
    const past = req.query.past === 'true';
    
    const options = {
      page,
      limit,
      isActive,
      upcoming,
      past
    };
    
    const events = await Event.getAll(options);
    const total = await Event.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      events,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.getById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // If user is logged in, check if already registered
    if (req.user) {
      const registration = await EventRegistration.checkUserRegistered(req.user.id, id);
      event.is_registered = !!registration;
      event.registration_status = registration ? registration.status : null;
    }
    
    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Create new event (admin only)
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      name, 
      description, 
      event_date, 
      fee, 
      location, 
      points 
    } = req.body;
    
    // Prepare event data
    const eventData = {
      name,
      description,
      event_date,
      fee: fee || 0,
      location,
      points: points || 0,
      created_by: req.user.id
    };
    
    // Create event
    const newEvent = await Event.create(eventData, req.files);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Update event (admin only)
exports.updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    
    // Check if event exists
    const event = await Event.getById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const { 
      name, 
      description, 
      event_date, 
      fee, 
      location, 
      points,
      is_active
    } = req.body;
    
    // Prepare update data
    const eventData = {
      name,
      description,
      event_date,
      fee,
      location,
      points,
      is_active
    };
    
    // Update event
    const updatedEvent = await Event.update(id, eventData, req.files);
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Delete event (admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const event = await Event.getById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    try {
      const success = await Event.delete(id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete event'
        });
      }
      
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (deleteError) {
      if (deleteError.message.includes('registrations')) {
        return res.status(400).json({
          success: false,
          message: 'Event cannot be deleted because it has registrations'
        });
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Register for event (user)
exports.registerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const event = await Event.getById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if event is active
    if (!event.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Registration for this event is closed'
      });
    }
    
    // Check if event date has passed
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    if (eventDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Event date has already passed'
      });
    }
    
    // Check if already registered
    const existingReg = await EventRegistration.checkUserRegistered(req.user.id, id);
    
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
        registration: {
          id: existingReg.id,
          status: existingReg.status
        }
      });
    }
    
    // Register for event
    const registration = await EventRegistration.registerUser(req.user.id, id);
    
    // If event is free, mark as completed immediately
    if (parseFloat(event.fee) === 0) {
      await EventRegistration.completeRegistration(registration.id);
      
      res.status(201).json({
        success: true,
        message: 'Successfully registered for event',
        registration_id: registration.id,
        fee: 0,
        status: 'completed' // No payment needed for free events
      });
    } else {
      // For paid events
      res.status(201).json({
        success: true,
        message: 'Successfully registered for event',
        registration_id: registration.id,
        fee: event.fee,
        status: 'registered', // Needs payment
        payment_required: true
      });
    }
  } catch (error) {
    console.error('Register event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Get user event registrations
exports.getUserEventRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const registrations = await EventRegistration.getUserRegistrations(userId);
    
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Get user event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Mark user as attended (admin only)
exports.markAttended = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get registration details
    const registration = await EventRegistration.getById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Mark as attended and award points
    const result = await EventRegistration.markAttended(id, registration.user_id, registration.event_id);
    
    res.json({
      success: true,
      message: `User marked as attended and awarded ${result.points} points`,
      points_awarded: result.points
    });
  } catch (error) {
    console.error('Mark attended error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Get event registrations (admin)
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const options = {
      page,
      limit,
      eventId,
      status
    };
    
    const registrations = await EventRegistration.getAll(options);
    const total = await EventRegistration.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      registrations,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};