const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Slider {
  // Dapatkan semua slider
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT s.*, u.full_name as created_by_name
        FROM sliders s
        JOIN users u ON s.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status aktif
      if (options.isActive !== undefined) {
        query += ' WHERE s.is_active = ?';
        params.push(options.isActive);
      }
      
      // Sorting berdasarkan order_number
      query += ' ORDER BY s.order_number ASC, s.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [sliders] = await pool.query(query, params);
      
      return sliders;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total slider (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM sliders';
      const params = [];
      
      // Filter berdasarkan status aktif
      if (options.isActive !== undefined) {
        query += ' WHERE is_active = ?';
        params.push(options.isActive);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan slider berdasarkan ID
  static async getById(id) {
    try {
      const [sliders] = await pool.query(
        `SELECT s.*, u.full_name as created_by_name
        FROM sliders s
        JOIN users u ON s.created_by = u.id
        WHERE s.id = ?`,
        [id]
      );
      
      return sliders.length > 0 ? sliders[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat slider baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        description, 
        is_active, 
        order_number, 
        created_by 
      } = data;
      
      let image_path = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `slider-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/sliders', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/sliders/${fileName}`;
      } else {
        throw new Error('Gambar slider wajib diupload');
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO sliders 
        (title, description, image_path, is_active, order_number, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, image_path, is_active, order_number, created_by]
      );
      
      const sliderId = result.insertId;
      
      // Ambil data slider yang baru dibuat
      const [sliders] = await connection.query(
        `SELECT s.*, u.full_name as created_by_name
        FROM sliders s
        JOIN users u ON s.created_by = u.id
        WHERE s.id = ?`,
        [sliderId]
      );
      
      await connection.commit();
      
      return sliders[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error, hapus file yang telah diupload (jika ada)
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
  
  // Update slider
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data slider yang akan diupdate
      const [sliders] = await connection.query('SELECT * FROM sliders WHERE id = ?', [id]);
      
      if (sliders.length === 0) {
        throw new Error('Slider tidak ditemukan');
      }
      
      const slider = sliders[0];
      
      const { 
        title, 
        description, 
        is_active, 
        order_number 
      } = data;
      
      let image_path = slider.image_path;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (slider.image_path) {
          const oldFilePath = path.join(__dirname, '..', slider.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `slider-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/sliders', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/sliders/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE sliders 
        SET title = ?, description = ?, image_path = ?, is_active = ?, order_number = ? 
        WHERE id = ?`,
        [
          title !== undefined ? title : slider.title,
          description !== undefined ? description : slider.description,
          image_path,
          is_active !== undefined ? is_active : slider.is_active,
          order_number !== undefined ? order_number : slider.order_number,
          id
        ]
      );
      
      // Ambil data slider yang telah diupdate
      const [updatedSliders] = await connection.query(
        `SELECT s.*, u.full_name as created_by_name
        FROM sliders s
        JOIN users u ON s.created_by = u.id
        WHERE s.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedSliders[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error dan ada file baru, hapus file tersebut
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
  
  // Hapus slider
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data slider yang akan dihapus
      const [sliders] = await connection.query('SELECT * FROM sliders WHERE id = ?', [id]);
      
      if (sliders.length === 0) {
        throw new Error('Slider tidak ditemukan');
      }
      
      const slider = sliders[0];
      
      // Hapus slider dari database
      const [result] = await connection.query('DELETE FROM sliders WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && slider.image_path) {
        const filePath = path.join(__dirname, '..', slider.image_path);
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
  
  // Ubah status aktif/nonaktif slider
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        'UPDATE sliders SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan slider yang aktif untuk frontend
  static async getActiveSliders() {
    try {
      const [sliders] = await pool.query(
        `SELECT id, title, description, image_path
        FROM sliders
        WHERE is_active = TRUE
        ORDER BY order_number ASC, created_at DESC`
      );
      
      return sliders;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Slider;