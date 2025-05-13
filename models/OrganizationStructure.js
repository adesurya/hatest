const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class OrganizationStructure {
  // Dapatkan semua struktur organisasi
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT os.*, u.full_name as created_by_name
        FROM organization_structure os
        JOIN users u ON os.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status aktif
      if (options.isActive !== undefined) {
        query += ' WHERE os.is_active = ?';
        params.push(options.isActive);
      }
      
      // Sorting
      query += ' ORDER BY os.position ASC, os.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [structures] = await pool.query(query, params);
      
      return structures;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total struktur organisasi (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM organization_structure';
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
  
  // Dapatkan struktur organisasi berdasarkan ID
  static async getById(id) {
    try {
      const [structures] = await pool.query(
        `SELECT os.*, u.full_name as created_by_name
        FROM organization_structure os
        JOIN users u ON os.created_by = u.id
        WHERE os.id = ?`,
        [id]
      );
      
      return structures.length > 0 ? structures[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat struktur organisasi baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        description, 
        position, 
        is_active, 
        created_by 
      } = data;
      
      let image_path = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/org-structure', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/org-structure/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO organization_structure 
        (title, description, image_path, position, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, image_path, position || 0, is_active || true, created_by]
      );
      
      const structureId = result.insertId;
      
      // Ambil data struktur organisasi yang baru dibuat
      const [structures] = await connection.query(
        `SELECT os.*, u.full_name as created_by_name
        FROM organization_structure os
        JOIN users u ON os.created_by = u.id
        WHERE os.id = ?`,
        [structureId]
      );
      
      await connection.commit();
      
      return structures[0];
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
  
  // Update struktur organisasi
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data struktur organisasi yang akan diupdate
      const [structures] = await connection.query('SELECT * FROM organization_structure WHERE id = ?', [id]);
      
      if (structures.length === 0) {
        throw new Error('Struktur organisasi tidak ditemukan');
      }
      
      const structure = structures[0];
      
      const { 
        title, 
        description, 
        position, 
        is_active 
      } = data;
      
      let image_path = structure.image_path;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (structure.image_path) {
          const oldFilePath = path.join(__dirname, '..', structure.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/org-structure', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/org-structure/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE organization_structure 
        SET title = ?, description = ?, image_path = ?, position = ?, is_active = ? 
        WHERE id = ?`,
        [
          title || structure.title, 
          description !== undefined ? description : structure.description, 
          image_path, 
          position !== undefined ? position : structure.position, 
          is_active !== undefined ? is_active : structure.is_active, 
          id
        ]
      );
      
      // Ambil data struktur organisasi yang telah diupdate
      const [updatedStructures] = await connection.query(
        `SELECT os.*, u.full_name as created_by_name
        FROM organization_structure os
        JOIN users u ON os.created_by = u.id
        WHERE os.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedStructures[0];
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
  
  // Hapus struktur organisasi
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data struktur organisasi yang akan dihapus
      const [structures] = await connection.query('SELECT * FROM organization_structure WHERE id = ?', [id]);
      
      if (structures.length === 0) {
        throw new Error('Struktur organisasi tidak ditemukan');
      }
      
      const structure = structures[0];
      
      // Hapus struktur organisasi dari database
      const [result] = await connection.query('DELETE FROM organization_structure WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && structure.image_path) {
        const filePath = path.join(__dirname, '..', structure.image_path);
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

module.exports = OrganizationStructure;