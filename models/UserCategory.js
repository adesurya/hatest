const { pool } = require('../config/database');

class UserCategory {
  // Get all user categories
  static async getAll() {
    try {
      const [categories] = await pool.query('SELECT * FROM user_categories');
      return categories;
    } catch (error) {
      throw error;
    }
  }
  
  // Get category by id
  static async getById(id) {
    try {
      const [categories] = await pool.query('SELECT * FROM user_categories WHERE id = ?', [id]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Get category by name
  static async getByName(name) {
    try {
      const [categories] = await pool.query('SELECT * FROM user_categories WHERE name = ?', [name]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Get non-admin categories (Dokter & Dokter Muda)
  static async getNonAdminCategories() {
    try {
      const [categories] = await pool.query(
        'SELECT * FROM user_categories WHERE name IN ("Dokter", "dokterMuda")'
      );
      return categories;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserCategory;