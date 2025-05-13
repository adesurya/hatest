const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Event {
  // Get all events with optional filtering
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT e.*, u.full_name as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
      `;
      
      const params = [];
      
      // Filter by active status
      if (options.isActive !== undefined) {
        query += ' WHERE e.is_active = ?';
        params.push(options.isActive);
      }
      
      // Filter by date range (upcoming events)
      if (options.upcoming) {
        const whereClause = params.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} e.event_date >= CURRENT_DATE()`;
      }
      
      // Filter by past events
      if (options.past) {
        const whereClause = params.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} e.event_date < CURRENT_DATE()`;
      }
      
      // Sorting
      query += ' ORDER BY e.event_date ASC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [events] = await pool.query(query, params);
      
      return events;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total events (for pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM events';
      const params = [];
      
      // Filter by active status
      if (options.isActive !== undefined) {
        query += ' WHERE is_active = ?';
        params.push(options.isActive);
      }
      
      // Filter by date range (upcoming events)
      if (options.upcoming) {
        const whereClause = params.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} event_date >= CURRENT_DATE()`;
      }
      
      // Filter by past events
      if (options.past) {
        const whereClause = params.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} event_date < CURRENT_DATE()`;
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Get event by ID
  static async getById(id) {
    try {
      const [events] = await pool.query(
        `SELECT e.*, u.full_name as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [id]
      );
      
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create new event
  static async create(data, files) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        name, 
        description, 
        event_date, 
        fee, 
        location, 
        points,
        created_by 
      } = data;
      
      let supporting_document = null;
      let image = null;
      
      // Handle document upload if provided
      if (files && files.supporting_document) {
        const file = files.supporting_document[0];
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/events/documents', fileName);
        
        // Make sure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        supporting_document = `/uploads/events/documents/${fileName}`;
      }
      
      // Handle image upload if provided
      if (files && files.image) {
        const file = files.image[0];
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/events/images', fileName);
        
        // Make sure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        image = `/uploads/events/images/${fileName}`;
      }
      
      // Insert into database
      const [result] = await connection.query(
        `INSERT INTO events 
        (name, description, event_date, fee, location, points, supporting_document, image, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, event_date, fee, location, points, supporting_document, image, created_by]
      );
      
      const eventId = result.insertId;
      
      // Get the newly created event
      const [events] = await connection.query(
        `SELECT e.*, u.full_name as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [eventId]
      );
      
      await connection.commit();
      
      return events[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs, delete uploaded file
      if (data.supporting_document) {
        const filePath = path.join(__dirname, '..', data.supporting_document);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update event
  static async update(id, data, files) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get the event to be updated
      const [events] = await connection.query('SELECT * FROM events WHERE id = ?', [id]);
      
      if (events.length === 0) {
        throw new Error('Event not found');
      }
      
      const event = events[0];
      
      const { 
        name, 
        description, 
        event_date, 
        fee, 
        location, 
        points,
        is_active
      } = data;
      
      let supporting_document = event.supporting_document;
      let image = event.image;
      
      // If new document is uploaded
      if (files && files.supporting_document) {
        const file = files.supporting_document[0];
        // Delete old file if exists
        if (event.supporting_document) {
          const oldFilePath = path.join(__dirname, '..', event.supporting_document);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/events/documents', fileName);
        
        // Make sure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        supporting_document = `/uploads/events/documents/${fileName}`;
      }
      
      // If new image is uploaded
      if (files && files.image) {
        const file = files.image[0];
        // Delete old image if exists
        if (event.image) {
          const oldFilePath = path.join(__dirname, '..', event.image);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/events/images', fileName);
        
        // Make sure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        image = `/uploads/events/images/${fileName}`;
      }
      
      // Update database
      await connection.query(
        `UPDATE events 
        SET name = ?, description = ?, event_date = ?, 
        fee = ?, location = ?, points = ?, 
        supporting_document = ?, image = ?, is_active = ? 
        WHERE id = ?`,
        [
          name || event.name, 
          description || event.description, 
          event_date || event.event_date, 
          fee || event.fee, 
          location || event.location, 
          points !== undefined ? points : event.points, 
          supporting_document, 
          image,
          is_active !== undefined ? is_active : event.is_active, 
          id
        ]
      );
      
      // Get the updated event
      const [updatedEvents] = await connection.query(
        `SELECT e.*, u.full_name as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedEvents[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs with new file, delete it
      if (file && data.supporting_document) {
        const filePath = path.join(__dirname, '..', data.supporting_document);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete event
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if event has registrations
      const [registrations] = await connection.query(
        'SELECT id FROM event_registrations WHERE event_id = ? LIMIT 1',
        [id]
      );
      
      if (registrations.length > 0) {
        throw new Error('Event cannot be deleted because it has registrations');
      }
      
      // Get the event to be deleted
      const [events] = await connection.query('SELECT * FROM events WHERE id = ?', [id]);
      
      if (events.length === 0) {
        throw new Error('Event not found');
      }
      
      const event = events[0];
      
      // Delete from database
      const [result] = await connection.query('DELETE FROM events WHERE id = ?', [id]);
      
      // If deleted successfully and has files, delete the files
      if (result.affectedRows > 0) {
        // Delete supporting document if exists
        if (event.supporting_document) {
          const docFilePath = path.join(__dirname, '..', event.supporting_document);
          if (fs.existsSync(docFilePath)) {
            fs.unlinkSync(docFilePath);
          }
        }
        
        // Delete image if exists
        if (event.image) {
          const imgFilePath = path.join(__dirname, '..', event.image);
          if (fs.existsSync(imgFilePath)) {
            fs.unlinkSync(imgFilePath);
          }
        }
      }
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Check if event is full (for future use - if there's a capacity limit)
  static async isEventFull(id) {
    try {
      const event = await this.getById(id);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // For now, events don't have capacity limit
      return false;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Event;