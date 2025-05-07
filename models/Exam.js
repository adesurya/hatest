const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Exam {
  // Dapatkan semua ujian
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT e.*, ec.name as category_name, u.full_name as created_by_name
        FROM exams e
        JOIN exam_categories ec ON e.category_id = ec.id
        JOIN users u ON e.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan kategori
      if (options.categoryId) {
        query += ' WHERE e.category_id = ?';
        params.push(options.categoryId);
      }
      
      // Sorting
      query += ' ORDER BY e.exam_date DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [exams] = await pool.query(query, params);
      
      return exams;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total ujian (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM exams';
      const params = [];
      
      // Filter berdasarkan kategori
      if (options.categoryId) {
        query += ' WHERE category_id = ?';
        params.push(options.categoryId);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan ujian berdasarkan ID
  static async getById(id) {
    try {
      const [exams] = await pool.query(
        `SELECT e.*, ec.name as category_name, u.full_name as created_by_name
        FROM exams e
        JOIN exam_categories ec ON e.category_id = ec.id
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [id]
      );
      
      return exams.length > 0 ? exams[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat ujian baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        name, 
        category_id, 
        description, 
        requirements, 
        location, 
        exam_date, 
        fee, 
        created_by 
      } = data;
      
      let supporting_document = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/exams', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        supporting_document = `/uploads/exams/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO exams 
        (name, category_id, description, requirements, location, exam_date, supporting_document, fee, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, category_id, description, requirements, location, exam_date, supporting_document, fee, created_by]
      );
      
      const examId = result.insertId;
      
      // Ambil data ujian yang baru dibuat
      const [exams] = await connection.query(
        `SELECT e.*, ec.name as category_name, u.full_name as created_by_name
        FROM exams e
        JOIN exam_categories ec ON e.category_id = ec.id
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [examId]
      );
      
      await connection.commit();
      
      return exams[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error, hapus file yang telah diupload (jika ada)
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
  
  // Update ujian
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data ujian yang akan diupdate
      const [exams] = await connection.query('SELECT * FROM exams WHERE id = ?', [id]);
      
      if (exams.length === 0) {
        throw new Error('Ujian tidak ditemukan');
      }
      
      const exam = exams[0];
      
      const { 
        name, 
        category_id, 
        description, 
        requirements, 
        location, 
        exam_date, 
        fee 
      } = data;
      
      let supporting_document = exam.supporting_document;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (exam.supporting_document) {
          const oldFilePath = path.join(__dirname, '..', exam.supporting_document);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/exams', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        supporting_document = `/uploads/exams/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE exams 
        SET name = ?, category_id = ?, description = ?, requirements = ?, 
        location = ?, exam_date = ?, supporting_document = ?, fee = ? 
        WHERE id = ?`,
        [name, category_id, description, requirements, location, exam_date, supporting_document, fee, id]
      );
      
      // Ambil data ujian yang telah diupdate
      const [updatedExams] = await connection.query(
        `SELECT e.*, ec.name as category_name, u.full_name as created_by_name
        FROM exams e
        JOIN exam_categories ec ON e.category_id = ec.id
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedExams[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error dan ada file baru, hapus file tersebut
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
  
  // Hapus ujian
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Periksa apakah ada pendaftaran untuk ujian ini
      const [registrations] = await connection.query(
        'SELECT id FROM exam_registrations WHERE exam_id = ? LIMIT 1',
        [id]
      );
      
      if (registrations.length > 0) {
        throw new Error('Ujian tidak dapat dihapus karena sudah ada pendaftaran');
      }
      
      // Ambil data ujian yang akan dihapus
      const [exams] = await connection.query('SELECT * FROM exams WHERE id = ?', [id]);
      
      if (exams.length === 0) {
        throw new Error('Ujian tidak ditemukan');
      }
      
      const exam = exams[0];
      
      // Hapus ujian dari database
      const [result] = await connection.query('DELETE FROM exams WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && exam.supporting_document) {
        const filePath = path.join(__dirname, '..', exam.supporting_document);
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

module.exports = Exam;