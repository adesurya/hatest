const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class OrganizationHistory {
  // Dapatkan semua sejarah organisasi
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT oh.*, u.full_name as created_by_name
        FROM organization_history oh
        JOIN users u ON oh.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status aktif (untuk publik)
      if (options.publicView) {
        query += ' WHERE oh.is_active = TRUE';
      }
      
      // Sorting
      query += ' ORDER BY oh.year ASC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [histories] = await pool.query(query, params);
      
      return histories;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total sejarah organisasi (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM organization_history';
      const params = [];
      
      // Filter berdasarkan status aktif (untuk publik)
      if (options.publicView) {
        query += ' WHERE is_active = TRUE';
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan sejarah organisasi berdasarkan ID
  static async getById(id) {
    try {
      const [histories] = await pool.query(
        `SELECT oh.*, u.full_name as created_by_name
        FROM organization_history oh
        JOIN users u ON oh.created_by = u.id
        WHERE oh.id = ?`,
        [id]
      );
      
      return histories.length > 0 ? histories[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat sejarah organisasi baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        content, 
        year, 
        is_active,
        created_by 
      } = data;
      
      let image_path = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/organization-history', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/organization-history/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO organization_history 
        (title, content, year, image_path, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, content, year, image_path, is_active ?? true, created_by]
      );
      
      const historyId = result.insertId;
      
      // Ambil data sejarah yang baru dibuat
      const [histories] = await connection.query(
        `SELECT oh.*, u.full_name as created_by_name
        FROM organization_history oh
        JOIN users u ON oh.created_by = u.id
        WHERE oh.id = ?`,
        [historyId]
      );
      
      await connection.commit();
      
      return histories[0];
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
  
  // Update sejarah organisasi
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data sejarah yang akan diupdate
      const [histories] = await connection.query('SELECT * FROM organization_history WHERE id = ?', [id]);
      
      if (histories.length === 0) {
        throw new Error('Sejarah organisasi tidak ditemukan');
      }
      
      const history = histories[0];
      
      const { 
        title, 
        content, 
        year, 
        is_active 
      } = data;
      
      let image_path = history.image_path;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (history.image_path) {
          const oldFilePath = path.join(__dirname, '..', history.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/organization-history', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/organization-history/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE organization_history 
        SET title = ?, content = ?, year = ?, image_path = ?, is_active = ? 
        WHERE id = ?`,
        [
          title !== undefined ? title : history.title, 
          content !== undefined ? content : history.content, 
          year !== undefined ? year : history.year, 
          image_path, 
          is_active !== undefined ? is_active : history.is_active, 
          id
        ]
      );
      
      // Ambil data sejarah yang telah diupdate
      const [updatedHistories] = await connection.query(
        `SELECT oh.*, u.full_name as created_by_name
        FROM organization_history oh
        JOIN users u ON oh.created_by = u.id
        WHERE oh.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedHistories[0];
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
  
  // Hapus sejarah organisasi
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data sejarah yang akan dihapus
      const [histories] = await connection.query('SELECT * FROM organization_history WHERE id = ?', [id]);
      
      if (histories.length === 0) {
        throw new Error('Sejarah organisasi tidak ditemukan');
      }
      
      const history = histories[0];
      
      // Hapus sejarah dari database
      const [result] = await connection.query('DELETE FROM organization_history WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && history.image_path) {
        const filePath = path.join(__dirname, '..', history.image_path);
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

module.exports = OrganizationHistory;