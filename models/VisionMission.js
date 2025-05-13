const { pool } = require('../config/database');

class VisionMission {
  // Get all vision and mission items (optional filters)
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT vm.*, u.full_name as created_by_name
        FROM vision_mission vm
        JOIN users u ON vm.created_by = u.id
      `;
      
      const params = [];
      
      // Filter by type if provided
      if (options.type) {
        query += ' WHERE vm.type = ?';
        params.push(options.type);
      }
      
      // Filter by active status if provided
      if (options.isActive !== undefined) {
        query += options.type ? ' AND vm.is_active = ?' : ' WHERE vm.is_active = ?';
        params.push(options.isActive);
      }
      
      // Order by type first, then by order_number
      query += ' ORDER BY vm.type ASC, vm.order_number ASC';
      
      const [items] = await pool.query(query, params);
      
      return items;
    } catch (error) {
      throw error;
    }
  }
  
  // Get vision and mission item by ID
  static async getById(id) {
    try {
      const [items] = await pool.query(
        `SELECT vm.*, u.full_name as created_by_name
        FROM vision_mission vm
        JOIN users u ON vm.created_by = u.id
        WHERE vm.id = ?`,
        [id]
      );
      
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create a new vision or mission item
  static async create(data) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { type, content, order_number, is_active, created_by } = data;
      
      // Check if the order number is already in use for this type
      const [existingItems] = await connection.query(
        'SELECT id FROM vision_mission WHERE type = ? AND order_number = ?',
        [type, order_number]
      );
      
      if (existingItems.length > 0) {
        // If order number exists, shift other items to make room
        await connection.query(
          'UPDATE vision_mission SET order_number = order_number + 1 WHERE type = ? AND order_number >= ?',
          [type, order_number]
        );
      }
      
      // Insert the new item
      const [result] = await connection.query(
        `INSERT INTO vision_mission 
        (type, content, order_number, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?)`,
        [type, content, order_number, is_active, created_by]
      );
      
      const newItemId = result.insertId;
      
      // Get the newly created item
      const [newItems] = await connection.query(
        `SELECT vm.*, u.full_name as created_by_name
        FROM vision_mission vm
        JOIN users u ON vm.created_by = u.id
        WHERE vm.id = ?`,
        [newItemId]
      );
      
      await connection.commit();
      
      return newItems[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update a vision or mission item
  static async update(id, data) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get the current item to check if order_number or type changes
      const [currentItems] = await connection.query(
        'SELECT * FROM vision_mission WHERE id = ?',
        [id]
      );
      
      if (currentItems.length === 0) {
        throw new Error('Item tidak ditemukan');
      }
      
      const currentItem = currentItems[0];
      const { type, content, order_number, is_active } = data;
      
      // Check if order_number or type is changing
      if ((type && type !== currentItem.type) || (order_number && order_number !== currentItem.order_number)) {
        // If order_number exists for the target type, we need to rearrange
        const [existingItems] = await connection.query(
          'SELECT id FROM vision_mission WHERE type = ? AND order_number = ? AND id != ?',
          [type || currentItem.type, order_number || currentItem.order_number, id]
        );
        
        if (existingItems.length > 0) {
          // Shift items to make room for the updated item
          await connection.query(
            'UPDATE vision_mission SET order_number = order_number + 1 WHERE type = ? AND order_number >= ? AND id != ?',
            [type || currentItem.type, order_number || currentItem.order_number, id]
          );
        }
      }
      
      // Update the item
      await connection.query(
        `UPDATE vision_mission 
        SET type = ?, content = ?, order_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          type || currentItem.type, 
          content || currentItem.content, 
          order_number || currentItem.order_number, 
          is_active !== undefined ? is_active : currentItem.is_active, 
          id
        ]
      );
      
      // Get the updated item
      const [updatedItems] = await connection.query(
        `SELECT vm.*, u.full_name as created_by_name
        FROM vision_mission vm
        JOIN users u ON vm.created_by = u.id
        WHERE vm.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedItems[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete a vision or mission item
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get the item that will be deleted to know its type and order
      const [items] = await connection.query(
        'SELECT * FROM vision_mission WHERE id = ?',
        [id]
      );
      
      if (items.length === 0) {
        throw new Error('Item tidak ditemukan');
      }
      
      const item = items[0];
      
      // Delete the item
      const [result] = await connection.query(
        'DELETE FROM vision_mission WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Gagal menghapus item');
      }
      
      // Reorder the remaining items of the same type
      await connection.query(
        'UPDATE vision_mission SET order_number = order_number - 1 WHERE type = ? AND order_number > ?',
        [item.type, item.order_number]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Toggle active status
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        'UPDATE vision_mission SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Get max order number for a type
  static async getMaxOrderNumber(type) {
    try {
      const [result] = await pool.query(
        'SELECT MAX(order_number) as max_order FROM vision_mission WHERE type = ?',
        [type]
      );
      
      return result[0].max_order || 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VisionMission;