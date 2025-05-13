const { pool } = require('../config/database');

class Contact {
  // Dapatkan semua data kontak
  static async getAll() {
    try {
      const [contacts] = await pool.query(
        `SELECT c.*, u.full_name as created_by_name
        FROM contacts c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC`
      );
      return contacts;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan kontak berdasarkan ID
  static async getById(id) {
    try {
      const [contacts] = await pool.query(
        `SELECT c.*, u.full_name as created_by_name
        FROM contacts c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?`,
        [id]
      );
      
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat kontak baru
  static async create(data) {
    try {
      const { 
        title, 
        address, 
        phone, 
        email, 
        website, 
        open_hours, 
        created_by 
      } = data;
      
      const [result] = await pool.query(
        `INSERT INTO contacts 
        (title, address, phone, email, website, open_hours, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, address, phone, email, website, open_hours, created_by]
      );
      
      return {
        id: result.insertId,
        ...data
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update kontak
  static async update(id, data) {
    try {
      const { 
        title, 
        address, 
        phone, 
        email, 
        website, 
        open_hours 
      } = data;
      
      const [result] = await pool.query(
        `UPDATE contacts 
        SET title = ?, address = ?, phone = ?, email = ?, website = ?, open_hours = ? 
        WHERE id = ?`,
        [title, address, phone, email, website, open_hours, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus kontak
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Contact;