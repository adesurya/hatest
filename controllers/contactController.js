const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');

// Dapatkan semua kontak
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.getAll();
    
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan kontak berdasarkan ID
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.getById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Kontak tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat kontak baru (admin only)
exports.createContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      title, 
      address, 
      phone, 
      email, 
      website, 
      open_hours 
    } = req.body;
    
    // Buat kontak baru
    const contactData = {
      title,
      address,
      phone,
      email,
      website: website || null,
      open_hours: open_hours || null,
      created_by: req.user.id
    };
    
    const newContact = await Contact.create(contactData);
    
    res.status(201).json({
      success: true,
      message: 'Kontak berhasil dibuat',
      contact: newContact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update kontak (admin only)
exports.updateContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { 
      title, 
      address, 
      phone, 
      email, 
      website, 
      open_hours 
    } = req.body;
    
    // Cek apakah kontak ada
    const contact = await Contact.getById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Kontak tidak ditemukan'
      });
    }
    
    // Update kontak
    const contactData = {
      title,
      address,
      phone,
      email,
      website: website || null,
      open_hours: open_hours || null
    };
    
    const success = await Contact.update(id, contactData);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate kontak'
      });
    }
    
    // Ambil kontak yang sudah diupdate
    const updatedContact = await Contact.getById(id);
    
    res.json({
      success: true,
      message: 'Kontak berhasil diupdate',
      contact: updatedContact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus kontak (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah kontak ada
    const contact = await Contact.getById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Kontak tidak ditemukan'
      });
    }
    
    const success = await Contact.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus kontak'
      });
    }
    
    res.json({
      success: true,
      message: 'Kontak berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};