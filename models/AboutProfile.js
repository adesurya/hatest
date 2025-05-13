const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class AboutProfile {
  // Get all about profiles with optional filtering
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT ap.*, u.full_name as created_by_name
        FROM about_profiles ap
        JOIN users u ON ap.created_by = u.id
      `;
      
      const params = [];
      
      // Filter for active profiles only if specified
      if (options.activeOnly) {
        query += ' WHERE ap.is_active = TRUE';
      }
      
      // Sorting by display order and then by creation date
      query += ' ORDER BY ap.display_order ASC, ap.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [profiles] = await pool.query(query, params);
      
      return profiles;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total profiles for pagination
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM about_profiles';
      const params = [];
      
      // Filter for active profiles only if specified
      if (options.activeOnly) {
        query += ' WHERE is_active = TRUE';
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Get about profile by ID
  static async getById(id) {
    try {
      const [profiles] = await pool.query(
        `SELECT ap.*, u.full_name as created_by_name
        FROM about_profiles ap
        JOIN users u ON ap.created_by = u.id
        WHERE ap.id = ?`,
        [id]
      );
      
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create new about profile
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        description, 
        display_order, 
        is_active, 
        created_by 
      } = data;
      
      let image_path = null;
      
      // Handle file upload if present
      if (file) {
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `about_profile_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/about_profiles', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/about_profiles/${fileName}`;
      }
      
      // Insert into database
      const [result] = await connection.query(
        `INSERT INTO about_profiles 
        (title, description, image_path, display_order, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, image_path, display_order || 0, is_active !== undefined ? is_active : true, created_by]
      );
      
      const profileId = result.insertId;
      
      // Get newly created profile
      const [profiles] = await connection.query(
        `SELECT ap.*, u.full_name as created_by_name
        FROM about_profiles ap
        JOIN users u ON ap.created_by = u.id
        WHERE ap.id = ?`,
        [profileId]
      );
      
      await connection.commit();
      
      return profiles[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs, remove uploaded file if any
      if (data.image_path) {
        const filePath = path.join(__dirname, '..', data.image_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update about profile
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get profile to be updated
      const [profiles] = await connection.query('SELECT * FROM about_profiles WHERE id = ?', [id]);
      
      if (profiles.length === 0) {
        throw new Error('About profile not found');
      }
      
      const profile = profiles[0];
      
      const { 
        title, 
        description, 
        display_order, 
        is_active 
      } = data;
      
      let image_path = profile.image_path;
      
      // Handle file upload if present
      if (file) {
        // Remove old file if exists
        if (profile.image_path) {
          const oldFilePath = path.join(__dirname, '..', profile.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `about_profile_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/about_profiles', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/about_profiles/${fileName}`;
      }
      
      // Update in database
      await connection.query(
        `UPDATE about_profiles 
        SET title = ?, description = ?, image_path = ?, display_order = ?, is_active = ? 
        WHERE id = ?`,
        [
          title || profile.title, 
          description || profile.description, 
          image_path, 
          display_order !== undefined ? display_order : profile.display_order, 
          is_active !== undefined ? is_active : profile.is_active, 
          id
        ]
      );
      
      // Get updated profile
      const [updatedProfiles] = await connection.query(
        `SELECT ap.*, u.full_name as created_by_name
        FROM about_profiles ap
        JOIN users u ON ap.created_by = u.id
        WHERE ap.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedProfiles[0];
    } catch (error) {
      await connection.rollback();
      
      // If error occurs and a new file was uploaded, remove it
      if (file && data.image_path) {
        const filePath = path.join(__dirname, '..', data.image_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete about profile
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get profile to be deleted
      const [profiles] = await connection.query('SELECT * FROM about_profiles WHERE id = ?', [id]);
      
      if (profiles.length === 0) {
        throw new Error('About profile not found');
      }
      
      const profile = profiles[0];
      
      // Delete from database
      const [result] = await connection.query('DELETE FROM about_profiles WHERE id = ?', [id]);
      
      // If successfully deleted and has image, remove the image file
      if (result.affectedRows > 0 && profile.image_path) {
        const filePath = path.join(__dirname, '..', profile.image_path);
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
}

module.exports = AboutProfile;