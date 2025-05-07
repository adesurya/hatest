const { pool } = require('../config/database');

class PaymentMethod {
  // Dapatkan semua metode pembayaran aktif
  static async getAllActive() {
    try {
      const [methods] = await pool.query(
        'SELECT * FROM payment_methods WHERE is_active = TRUE ORDER BY name ASC'
      );
      return methods;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan semua metode pembayaran (termasuk yang tidak aktif, untuk admin)
  static async getAll() {
    try {
      const [methods] = await pool.query('SELECT * FROM payment_methods ORDER BY name ASC');
      return methods;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan metode pembayaran berdasarkan ID
  static async getById(id) {
    try {
      const [methods] = await pool.query('SELECT * FROM payment_methods WHERE id = ?', [id]);
      return methods.length > 0 ? methods[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan metode pembayaran berdasarkan kode
  static async getByCode(code) {
    try {
      const [methods] = await pool.query('SELECT * FROM payment_methods WHERE code = ?', [code]);
      return methods.length > 0 ? methods[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Aktifkan atau nonaktifkan metode pembayaran
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        'UPDATE payment_methods SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Update metode pembayaran
  static async update(id, data) {
    try {
      const { name, description, is_active } = data;
      
      const [result] = await pool.query(
        'UPDATE payment_methods SET name = ?, description = ?, is_active = ? WHERE id = ?',
        [name, description, is_active, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaymentMethod;