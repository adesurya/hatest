const UserPoints = require('../models/UserPoints');
const { validationResult } = require('express-validator');

// Get user points
exports.getUserPoints = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // For non-admin users, they can only view their own points
    if (req.params.userId && req.params.userId !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own points'
      });
    }
    
    const pointsRecords = await UserPoints.getUserPoints(userId);
    const totalPoints = await UserPoints.getUserTotalPoints(userId);
    
    res.json({
      success: true,
      total_points: totalPoints.total_points || 0,
      last_earned_date: totalPoints.last_earned_date,
      points_records: pointsRecords
    });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Add points to user (admin only)
exports.addPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { user_id, event_id, points, notes } = req.body;
    
    const result = await UserPoints.addPoints(user_id, event_id, points, notes);
    
    res.json({
      success: true,
      message: result.updated ? 'Points updated successfully' : 'Points added successfully',
      points_record_id: result.id
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Delete points (admin only)
exports.deletePoints = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await UserPoints.deletePoints(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Points record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Points record deleted successfully'
    });
  } catch (error) {
    console.error('Delete points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await UserPoints.getLeaderboard(limit);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};