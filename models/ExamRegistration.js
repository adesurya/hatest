const { pool } = require('../config/database');

class ExamRegistration {
  // Dapatkan semua pendaftaran ujian
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT er.*, e.name as exam_name, e.exam_date, 
        u.full_name as user_name, u.email,
        t.merchant_order_id, t.status as payment_status, t.amount
        FROM exam_registrations er
        JOIN exams e ON er.exam_id = e.id
        JOIN users u ON er.user_id = u.id
        LEFT JOIN transactions t ON er.transaction_id = t.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status
      if (options.status) {
        query += ' WHERE er.status = ?';
        params.push(options.status);
      }
      
      // Filter berdasarkan ujian
      if (options.examId) {
        query += options.status ? ' AND er.exam_id = ?' : ' WHERE er.exam_id = ?';
        params.push(options.examId);
      }
      
      // Filter berdasarkan user
      if (options.userId) {
        query += options.status || options.examId ? ' AND er.user_id = ?' : ' WHERE er.user_id = ?';
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
  
  // Hitung total pendaftaran (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM exam_registrations er';
      const params = [];
      
      // Filter berdasarkan status
      if (options.status) {
        query += ' WHERE er.status = ?';
        params.push(options.status);
      }
      
      // Filter berdasarkan ujian
      if (options.examId) {
        query += options.status ? ' AND er.exam_id = ?' : ' WHERE er.exam_id = ?';
        params.push(options.examId);
      }
      
      // Filter berdasarkan user
      if (options.userId) {
        query += options.status || options.examId ? ' AND er.user_id = ?' : ' WHERE er.user_id = ?';
        params.push(options.userId);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan pendaftaran ujian berdasarkan ID
  static async getById(id) {
    try {
      const [registrations] = await pool.query(
        `SELECT er.*, e.name as exam_name, e.exam_date, 
        u.full_name as user_name, u.email,
        t.merchant_order_id, t.status as payment_status, t.amount
        FROM exam_registrations er
        JOIN exams e ON er.exam_id = e.id
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
  
  // Dapatkan pendaftaran ujian user
  static async getUserRegistrations(userId) {
    try {
      const [registrations] = await pool.query(
        `SELECT er.*, e.name as exam_name, e.exam_date, e.location, e.fee,
        t.status as payment_status, t.merchant_order_id, t.payment_date,
        t.qr_image_path, t.reference
        FROM exam_registrations er
        JOIN exams e ON er.exam_id = e.id
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
  
  // Cek apakah user sudah mendaftar ke ujian tertentu
  static async checkUserRegistered(userId, examId) {
    try {
      const [registrations] = await pool.query(
        'SELECT * FROM exam_registrations WHERE user_id = ? AND exam_id = ?',
        [userId, examId]
      );
      
      return registrations.length > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Update status pendaftaran
  static async updateStatus(id, status) {
    try {
      const [result] = await pool.query(
        'UPDATE exam_registrations SET status = ? WHERE id = ?',
        [status, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExamRegistration;