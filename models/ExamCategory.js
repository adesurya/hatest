const { pool } = require('../config/database');

class ExamCategory {
  // Dapatkan semua kategori ujian
  static async getAll() {
    try {
      const [categories] = await pool.query('SELECT * FROM exam_categories ORDER BY name ASC');
      return categories;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan kategori ujian berdasarkan ID
  static async getById(id) {
    try {
      const [categories] = await pool.query('SELECT * FROM exam_categories WHERE id = ?', [id]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat kategori ujian baru
  static async create(data) {
    try {
      const { name, description } = data;
      
      const [result] = await pool.query(
        'INSERT INTO exam_categories (name, description) VALUES (?, ?)',
        [name, description]
      );
      
      return {
        id: result.insertId,
        name,
        description
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update kategori ujian
  static async update(id, data) {
    try {
      const { name, description } = data;
      
      const [result] = await pool.query(
        'UPDATE exam_categories SET name = ?, description = ? WHERE id = ?',
        [name, description, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus kategori ujian
  static async delete(id) {
    try {
      // Cek apakah kategori memiliki ujian terkait
      const [exams] = await pool.query('SELECT id FROM exams WHERE category_id = ? LIMIT 1', [id]);
      
      if (exams.length > 0) {
        throw new Error('Kategori tidak dapat dihapus karena memiliki ujian terkait');
      }
      
      const [result] = await pool.query('DELETE FROM exam_categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExamCategory;