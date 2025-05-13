const { pool } = require('../config/database');

class OrganizationBenefit {
  // Dapatkan semua manfaat organisasi
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT ob.*, u.full_name as created_by_name
        FROM organization_benefits ob
        LEFT JOIN users u ON ob.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status aktif
      if (options.activeOnly) {
        query += ' WHERE ob.is_active = TRUE';
      }
      
      // Sorting berdasarkan sort_order dan kemudian berdasarkan created_at
      query += ' ORDER BY ob.sort_order ASC, ob.created_at ASC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [benefits] = await pool.query(query, params);
      
      return benefits;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total manfaat organisasi (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM organization_benefits';
      const params = [];
      
      // Filter berdasarkan status aktif
      if (options.activeOnly) {
        query += ' WHERE is_active = TRUE';
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan manfaat organisasi berdasarkan ID
  static async getById(id) {
    try {
      const [benefits] = await pool.query(
        `SELECT ob.*, u.full_name as created_by_name
        FROM organization_benefits ob
        LEFT JOIN users u ON ob.created_by = u.id
        WHERE ob.id = ?`,
        [id]
      );
      
      return benefits.length > 0 ? benefits[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat manfaat organisasi baru
  static async create(data) {
    try {
      const { 
        title, 
        description, 
        icon,
        is_active,
        sort_order,
        created_by 
      } = data;
      
      const [result] = await pool.query(
        `INSERT INTO organization_benefits 
        (title, description, icon, is_active, sort_order, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, icon, is_active, sort_order, created_by]
      );
      
      return {
        id: result.insertId,
        ...data
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update manfaat organisasi
  static async update(id, data) {
    try {
      const { 
        title, 
        description, 
        icon,
        is_active,
        sort_order
      } = data;
      
      const [result] = await pool.query(
        `UPDATE organization_benefits 
        SET title = ?, description = ?, icon = ?, is_active = ?, sort_order = ? 
        WHERE id = ?`,
        [title, description, icon, is_active, sort_order, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus manfaat organisasi
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM organization_benefits WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Update status aktif manfaat organisasi
  static async updateActiveStatus(id, isActive) {
    try {
      const [result] = await pool.query(
        'UPDATE organization_benefits SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Update urutan manfaat organisasi
  static async updateSortOrder(id, sortOrder) {
    try {
      const [result] = await pool.query(
        'UPDATE organization_benefits SET sort_order = ? WHERE id = ?',
        [sortOrder, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrganizationBenefit;