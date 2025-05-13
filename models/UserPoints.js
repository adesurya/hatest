const { pool } = require('../config/database');

class UserPoints {
  // Get user points by user ID
  static async getUserPoints(userId) {
    try {
      const [pointsRecords] = await pool.query(
        `SELECT up.*, e.name as event_name, e.event_date
        FROM user_points up
        JOIN events e ON up.event_id = e.id
        WHERE up.user_id = ?
        ORDER BY up.earned_date DESC`,
        [userId]
      );
      
      return pointsRecords;
    } catch (error) {
      throw error;
    }
  }
  
  // Get user total points
  static async getUserTotalPoints(userId) {
    try {
      const [result] = await pool.query(
        'SELECT * FROM user_total_points WHERE user_id = ?',
        [userId]
      );
      
      return result.length > 0 ? result[0] : { user_id: userId, total_points: 0, last_earned_date: null };
    } catch (error) {
      throw error;
    }
  }
  
  // Add points to user
  static async addPoints(userId, eventId, points, notes = null) {
    try {
      // Check if user already has points for this event
      const [existingPoints] = await pool.query(
        'SELECT * FROM user_points WHERE user_id = ? AND event_id = ?',
        [userId, eventId]
      );
      
      if (existingPoints.length > 0) {
        // Update existing record
        const [result] = await pool.query(
          'UPDATE user_points SET points = ?, earned_date = CURRENT_TIMESTAMP, notes = ? WHERE id = ?',
          [points, notes, existingPoints[0].id]
        );
        
        return {
          success: result.affectedRows > 0,
          id: existingPoints[0].id,
          updated: true
        };
      } else {
        // Create new record
        const [result] = await pool.query(
          'INSERT INTO user_points (user_id, event_id, points, notes) VALUES (?, ?, ?, ?)',
          [userId, eventId, points, notes]
        );
        
        return {
          success: result.affectedRows > 0,
          id: result.insertId,
          updated: false
        };
      }
    } catch (error) {
      throw error;
    }
  }
  
  // Get leaderboard (top users by points)
  static async getLeaderboard(limit = 10) {
    try {
      const [leaderboard] = await pool.query(
        `SELECT utp.user_id, u.full_name, utp.total_points, utp.last_earned_date
        FROM user_total_points utp
        JOIN users u ON utp.user_id = u.id
        ORDER BY utp.total_points DESC, utp.last_earned_date ASC
        LIMIT ?`,
        [limit]
      );
      
      return leaderboard;
    } catch (error) {
      throw error;
    }
  }
  
  // Delete points record
  static async deletePoints(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM user_points WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserPoints;