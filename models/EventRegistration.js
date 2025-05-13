const { pool } = require('../config/database');

class EventRegistration {
  // Get all event registrations
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT er.*, e.name as event_name, e.event_date, 
        u.full_name as user_name, u.email,
        t.merchant_order_id, t.status as payment_status, t.amount
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        JOIN users u ON er.user_id = u.id
        LEFT JOIN transactions t ON er.transaction_id = t.id
      `;
      
      const params = [];
      
      // Filter by status
      if (options.status) {
        query += ' WHERE er.status = ?';
        params.push(options.status);
      }
      
      // Filter by event
      if (options.eventId) {
        query += options.status ? ' AND er.event_id = ?' : ' WHERE er.event_id = ?';
        params.push(options.eventId);
      }
      
      // Filter by user
      if (options.userId) {
        query += options.status || options.eventId ? ' AND er.user_id = ?' : ' WHERE er.user_id = ?';
        params.push(options.userId);
      }
      
      // Sorting
      query += ' ORDER BY er.registration_date DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [registrations] = await pool.query(query, params);
      
      return registrations;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total registrations
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM event_registrations er';
      const params = [];
      
      // Filter by status
      if (options.status) {
        query += ' WHERE er.status = ?';
        params.push(options.status);
      }
      
      // Filter by event
      if (options.eventId) {
        query += options.status ? ' AND er.event_id = ?' : ' WHERE er.event_id = ?';
        params.push(options.eventId);
      }
      
      // Filter by user
      if (options.userId) {
        query += options.status || options.eventId ? ' AND er.user_id = ?' : ' WHERE er.user_id = ?';
        params.push(options.userId);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Get registration by ID
  static async getById(id) {
    try {
      const [registrations] = await pool.query(
        `SELECT er.*, e.name as event_name, e.event_date, e.points,
        u.full_name as user_name, u.email,
        t.merchant_order_id, t.status as payment_status, t.amount
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        JOIN users u ON er.user_id = u.id
        LEFT JOIN transactions t ON er.transaction_id = t.id
        WHERE er.id = ?`,
        [id]
      );
      
      return registrations.length > 0 ? registrations[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Get user event registrations
  static async getUserRegistrations(userId) {
    try {
      const [registrations] = await pool.query(
        `SELECT er.*, e.name as event_name, e.event_date, e.location, e.fee, e.points,
        t.status as payment_status, t.merchant_order_id, t.payment_date,
        t.qr_image_path, t.reference
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        LEFT JOIN transactions t ON er.transaction_id = t.id
        WHERE er.user_id = ?
        ORDER BY er.registration_date DESC`,
        [userId]
      );
      
      return registrations;
    } catch (error) {
      throw error;
    }
  }
  
  // Check if user is registered for an event
  static async checkUserRegistered(userId, eventId) {
    try {
      const [registrations] = await pool.query(
        'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
        [userId, eventId]
      );
      
      return registrations.length > 0 ? registrations[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Register user for an event
  static async registerUser(userId, eventId) {
    try {
      // Check if already registered
      const registration = await this.checkUserRegistered(userId, eventId);
      
      if (registration) {
        return { exists: true, registration };
      }
      
      // Register the user
      const [result] = await pool.query(
        'INSERT INTO event_registrations (user_id, event_id, status) VALUES (?, ?, "registered")',
        [userId, eventId]
      );
      
      if (result.affectedRows > 0) {
        return { 
          success: true, 
          id: result.insertId
        };
      }
      
      return { success: false };
    } catch (error) {
      throw error;
    }
  }
  
  // Update registration status
  static async updateStatus(id, status) {
    try {
      const [result] = await pool.query(
        'UPDATE event_registrations SET status = ? WHERE id = ?',
        [status, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Mark user as attended an event and award points
  static async markAttended(id, userId, eventId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update registration status
      const [updateResult] = await connection.query(
        'UPDATE event_registrations SET status = "attended" WHERE id = ?',
        [id]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error('Registration not found');
      }
      
      // Get event details to get points value
      const [events] = await connection.query(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );
      
      if (events.length === 0) {
        throw new Error('Event not found');
      }
      
      const event = events[0];
      const points = event.points || 0;
      
      // Check if user already has points for this event
      const [existingPoints] = await connection.query(
        'SELECT * FROM user_points WHERE user_id = ? AND event_id = ?',
        [userId, eventId]
      );
      
      if (existingPoints.length > 0) {
        // Update existing points record
        await connection.query(
          'UPDATE user_points SET points = ?, earned_date = CURRENT_TIMESTAMP, notes = ? WHERE id = ?',
          [points, `Points for attending event: ${event.name}`, existingPoints[0].id]
        );
      } else {
        // Create new points record
        await connection.query(
          'INSERT INTO user_points (user_id, event_id, points, notes) VALUES (?, ?, ?, ?)',
          [userId, eventId, points, `Points for attending event: ${event.name}`]
        );
      }
      
      await connection.commit();
      
      return {
        success: true,
        points: points
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Complete event registration (for events that don't require payment)
  static async completeRegistration(id) {
    try {
      const [result] = await pool.query(
        'UPDATE event_registrations SET status = "completed" WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EventRegistration;