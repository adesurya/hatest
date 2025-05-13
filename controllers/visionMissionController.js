const VisionMission = require('../models/VisionMission');
const { validationResult } = require('express-validator');

// Get all vision and mission items
exports.getAllItems = async (req, res) => {
  try {
    const type = req.query.type; // Optional filter by 'vision' or 'mission'
    let isActive = undefined;
    
    // Only admins can see inactive items
    if (req.user && req.user.is_admin) {
      isActive = req.query.is_active === 'true' ? true : 
                 req.query.is_active === 'false' ? false : 
                 undefined;
    } else {
      // Non-admins always see only active items
      isActive = true;
    }
    
    const items = await VisionMission.getAll({ type, isActive });
    
    // Group items by type for a better response structure
    const visionItems = items.filter(item => item.type === 'vision');
    const missionItems = items.filter(item => item.type === 'mission');
    
    res.json({
      success: true,
      data: {
        vision: visionItems,
        mission: missionItems
      }
    });
  } catch (error) {
    console.error('Get all vision and mission items error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get vision and mission item by ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await VisionMission.getById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan'
      });
    }
    
    // If user is not admin and the item is inactive, return not found
    if ((!req.user || !req.user.is_admin) && !item.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get vision and mission item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create a new vision or mission item (admin only)
exports.createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { type, content, order_number, is_active } = req.body;
    
    let orderNum = order_number;
    
    // If order_number not provided, get the max order number + 1
    if (!orderNum) {
      const maxOrder = await VisionMission.getMaxOrderNumber(type);
      orderNum = maxOrder + 1;
    }
    
    // Create new item
    const itemData = {
      type,
      content,
      order_number: orderNum,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.id
    };
    
    const newItem = await VisionMission.create(itemData);
    
    res.status(201).json({
      success: true,
      message: 'Item berhasil dibuat',
      data: newItem
    });
  } catch (error) {
    console.error('Create vision and mission item error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update a vision or mission item (admin only)
exports.updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { type, content, order_number, is_active } = req.body;
    
    // Check if item exists
    const item = await VisionMission.getById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan'
      });
    }
    
    // Update item
    const updatedItem = await VisionMission.update(id, {
      type,
      content,
      order_number,
      is_active
    });
    
    res.json({
      success: true,
      message: 'Item berhasil diupdate',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update vision and mission item error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete a vision or mission item (admin only)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const item = await VisionMission.getById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan'
      });
    }
    
    // Delete item
    const success = await VisionMission.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus item'
      });
    }
    
    res.json({
      success: true,
      message: 'Item berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete vision and mission item error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Toggle active status (admin only)
exports.toggleActive = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Check if item exists
    const item = await VisionMission.getById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan'
      });
    }
    
    // Toggle active status
    const success = await VisionMission.toggleActive(id, is_active);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengubah status item'
      });
    }
    
    res.json({
      success: true,
      message: `Item berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};