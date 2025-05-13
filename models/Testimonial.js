const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Testimonial {
  // Get all testimonials
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT t.*, u.full_name as created_by_name
        FROM testimonials t
        JOIN users u ON t.created_by = u.id
      `;
      
      const params = [];
      
      // Filter for active testimonials only if specified
      if (options.onlyActive) {
        query += ' WHERE t.is_active = TRUE';
      }
      
      // Sorting - default to newest first
      query += ' ORDER BY t.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [testimonials] = await pool.query(query, params);
      
      return testimonials;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total testimonials (for pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM testimonials';
      const params = [];
      
      // Filter for active testimonials only if specified
      if (options.onlyActive) {
        query += ' WHERE is_active = TRUE';
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Get testimonial by ID
  static async getById(id) {
    try {
      const [testimonials] = await pool.query(
        `SELECT t.*, u.full_name as created_by_name
        FROM testimonials t
        JOIN users u ON t.created_by = u.id
        WHERE t.id = ?`,
        [id]
      );
      
      return testimonials.length > 0 ? testimonials[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create a new testimonial
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        organization_name, 
        representative_name, 
        representative_position, 
        content, 
        rating, 
        is_active, 
        created_by 
      } = data;
      
      let logo_path = null;
      
      // If a logo file was uploaded
      if (file) {
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/testimonials', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        logo_path = `/uploads/testimonials/${fileName}`;
      }
      
      // Insert to database
      const [result] = await connection.query(
        `INSERT INTO testimonials 
        (organization_name, representative_name, representative_position, content, logo_path, rating, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [organization_name, representative_name, representative_position, content, logo_path, rating, is_active || true, created_by]
      );
      
      const testimonialId = result.insertId;
      
      // Get newly created testimonial
      const [testimonials] = await connection.query(
        `SELECT t.*, u.full_name as created_by_name
        FROM testimonials t
        JOIN users u ON t.created_by = u.id
        WHERE t.id = ?`,
        [testimonialId]
      );
      
      await connection.commit();
      
      return testimonials[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs, delete uploaded file (if any)
      if (data.logo_path) {
        const filePath = path.join(__dirname, '..', data.logo_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update testimonial
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get testimonial to be updated
      const [testimonials] = await connection.query('SELECT * FROM testimonials WHERE id = ?', [id]);
      
      if (testimonials.length === 0) {
        throw new Error('Testimonial tidak ditemukan');
      }
      
      const testimonial = testimonials[0];
      
      const { 
        organization_name, 
        representative_name, 
        representative_position, 
        content, 
        rating, 
        is_active 
      } = data;
      
      let logo_path = testimonial.logo_path;
      
      // If a new logo file was uploaded
      if (file) {
        // Delete old file if exists
        if (testimonial.logo_path) {
          const oldFilePath = path.join(__dirname, '..', testimonial.logo_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/testimonials', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        logo_path = `/uploads/testimonials/${fileName}`;
      }
      
      // Update in database
      await connection.query(
        `UPDATE testimonials 
        SET organization_name = ?, representative_name = ?, representative_position = ?, 
        content = ?, logo_path = ?, rating = ?, is_active = ? 
        WHERE id = ?`,
        [
          organization_name || testimonial.organization_name, 
          representative_name || testimonial.representative_name, 
          representative_position || testimonial.representative_position, 
          content || testimonial.content, 
          logo_path, 
          rating || testimonial.rating, 
          is_active !== undefined ? is_active : testimonial.is_active, 
          id
        ]
      );
      
      // Get updated testimonial
      const [updatedTestimonials] = await connection.query(
        `SELECT t.*, u.full_name as created_by_name
        FROM testimonials t
        JOIN users u ON t.created_by = u.id
        WHERE t.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedTestimonials[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs and new file was uploaded, delete it
      if (file && data.logo_path) {
        const filePath = path.join(__dirname, '..', data.logo_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete testimonial
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get testimonial to be deleted
      const [testimonials] = await connection.query('SELECT * FROM testimonials WHERE id = ?', [id]);
      
      if (testimonials.length === 0) {
        throw new Error('Testimonial tidak ditemukan');
      }
      
      const testimonial = testimonials[0];
      
      // Delete from database
      const [result] = await connection.query('DELETE FROM testimonials WHERE id = ?', [id]);
      
      // If successfully deleted and has logo, delete the file
      if (result.affectedRows > 0 && testimonial.logo_path) {
        const filePath = path.join(__dirname, '..', testimonial.logo_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
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
  
  // Toggle testimonial active status
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        'UPDATE testimonials SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Testimonial;