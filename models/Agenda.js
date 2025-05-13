const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Agenda {
  // Dapatkan semua agenda
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT a.*, u.full_name as created_by_name
        FROM activity_agenda a
        JOIN users u ON a.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status publikasi
      if (options.isPublished !== undefined) {
        query += ' WHERE a.is_published = ?';
        params.push(options.isPublished);
      }
      
      // Filter berdasarkan tanggal
      if (options.startDate) {
        query += params.length ? ' AND a.start_date >= ?' : ' WHERE a.start_date >= ?';
        params.push(options.startDate);
      }
      
      if (options.endDate) {
        query += params.length ? ' AND a.end_date <= ?' : ' WHERE a.end_date <= ?';
        params.push(options.endDate);
      }
      
      // Sorting
      query += ' ORDER BY a.start_date DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [agendas] = await pool.query(query, params);
      
      return agendas;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total agenda (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM activity_agenda';
      const params = [];
      
      // Filter berdasarkan status publikasi
      if (options.isPublished !== undefined) {
        query += ' WHERE is_published = ?';
        params.push(options.isPublished);
      }
      
      // Filter berdasarkan tanggal
      if (options.startDate) {
        query += params.length ? ' AND start_date >= ?' : ' WHERE start_date >= ?';
        params.push(options.startDate);
      }
      
      if (options.endDate) {
        query += params.length ? ' AND end_date <= ?' : ' WHERE end_date <= ?';
        params.push(options.endDate);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan agenda berdasarkan ID
  static async getById(id) {
    try {
      const [agendas] = await pool.query(
        `SELECT a.*, u.full_name as created_by_name
        FROM activity_agenda a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [id]
      );
      
      return agendas.length > 0 ? agendas[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat agenda baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        description, 
        location, 
        start_date, 
        end_date, 
        is_published, 
        created_by 
      } = data;
      
      let image_path = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/agenda', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/agenda/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO activity_agenda 
        (title, description, location, start_date, end_date, image_path, is_published, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, location, start_date, end_date, image_path, is_published, created_by]
      );
      
      const agendaId = result.insertId;
      
      // Ambil data agenda yang baru dibuat
      const [agendas] = await connection.query(
        `SELECT a.*, u.full_name as created_by_name
        FROM activity_agenda a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [agendaId]
      );
      
      await connection.commit();
      
      return agendas[0];
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
  
  // Update agenda
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data agenda yang akan diupdate
      const [agendas] = await connection.query('SELECT * FROM activity_agenda WHERE id = ?', [id]);
      
      if (agendas.length === 0) {
        throw new Error('Agenda tidak ditemukan');
      }
      
      const agenda = agendas[0];
      
      const { 
        title, 
        description, 
        location, 
        start_date, 
        end_date, 
        is_published 
      } = data;
      
      let image_path = agenda.image_path;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (agenda.image_path) {
          const oldFilePath = path.join(__dirname, '..', agenda.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/agenda', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        image_path = `/uploads/agenda/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE activity_agenda 
        SET title = ?, description = ?, location = ?, start_date = ?, 
        end_date = ?, image_path = ?, is_published = ? 
        WHERE id = ?`,
        [title, description, location, start_date, end_date, image_path, is_published, id]
      );
      
      // Ambil data agenda yang telah diupdate
      const [updatedAgendas] = await connection.query(
        `SELECT a.*, u.full_name as created_by_name
        FROM activity_agenda a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedAgendas[0];
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
  
  // Hapus agenda
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data agenda yang akan dihapus
      const [agendas] = await connection.query('SELECT * FROM activity_agenda WHERE id = ?', [id]);
      
      if (agendas.length === 0) {
        throw new Error('Agenda tidak ditemukan');
      }
      
      const agenda = agendas[0];
      
      // Hapus agenda dari database
      const [result] = await connection.query('DELETE FROM activity_agenda WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && agenda.image_path) {
        const filePath = path.join(__dirname, '..', agenda.image_path);
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
  
  // Toggle status publikasi
  static async togglePublishStatus(id, isPublished) {
    try {
      const [result] = await pool.query(
        'UPDATE activity_agenda SET is_published = ? WHERE id = ?',
        [isPublished, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Agenda;