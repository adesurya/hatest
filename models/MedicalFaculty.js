const { pool } = require('../config/database');

class MedicalFaculty {
  // Dapatkan semua fakultas kedokteran
  static async getAll(options = {}) {
    try {
      let query = `SELECT * FROM medical_faculties`;
      const params = [];
      
      // Filter berdasarkan pencarian jika ada
      if (options.search) {
        query += ` WHERE faculty_name LIKE ? OR university_name LIKE ? OR location LIKE ?`;
        const searchParam = `%${options.search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      // Sorting
      query += ` ORDER BY ${options.sort_by || 'faculty_name'} ${options.sort_order || 'ASC'}`;
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [faculties] = await pool.query(query, params);
      
      return faculties;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total fakultas kedokteran (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM medical_faculties';
      const params = [];
      
      // Filter berdasarkan pencarian jika ada
      if (options.search) {
        query += ` WHERE faculty_name LIKE ? OR university_name LIKE ? OR location LIKE ?`;
        const searchParam = `%${options.search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan fakultas kedokteran berdasarkan ID
  static async getById(id) {
    try {
      const [faculties] = await pool.query(
        'SELECT * FROM medical_faculties WHERE id = ?',
        [id]
      );
      
      return faculties.length > 0 ? faculties[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat fakultas kedokteran baru
  static async create(data) {
    try {
      const { 
        faculty_name, 
        university_name, 
        location, 
        accreditation, 
        internal_grade, 
        active_students, 
        established_year, 
        website, 
        contact_info, 
        notes 
      } = data;
      
      const [result] = await pool.query(
        `INSERT INTO medical_faculties 
        (faculty_name, university_name, location, accreditation, internal_grade, 
        active_students, established_year, website, contact_info, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [faculty_name, university_name, location, accreditation, internal_grade, 
        active_students, established_year, website, contact_info, notes]
      );
      
      return {
        id: result.insertId,
        ...data
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update fakultas kedokteran
  static async update(id, data) {
    try {
      const { 
        faculty_name, 
        university_name, 
        location, 
        accreditation, 
        internal_grade, 
        active_students, 
        established_year, 
        website, 
        contact_info, 
        notes 
      } = data;
      
      const [result] = await pool.query(
        `UPDATE medical_faculties 
        SET faculty_name = ?, university_name = ?, location = ?, 
        accreditation = ?, internal_grade = ?, active_students = ?, 
        established_year = ?, website = ?, contact_info = ?, notes = ? 
        WHERE id = ?`,
        [faculty_name, university_name, location, accreditation, internal_grade, 
        active_students, established_year, website, contact_info, notes, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus fakultas kedokteran
  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM medical_faculties WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MedicalFaculty;