const Agenda = require('../models/Agenda');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, GIF, atau WEBP.'));
    }
  }
}).single('image');

// Middleware upload file
exports.uploadImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Error upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// Dapatkan semua agenda
exports.getAllAgendas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Parameter tambahan
    const isPublished = req.query.is_published !== undefined ? 
      req.query.is_published === 'true' : undefined;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    const options = {
      page,
      limit,
      isPublished,
      startDate,
      endDate
    };
    
    // Jika user tidak login atau bukan admin, hanya tampilkan yang sudah dipublish
    if (!req.user || !req.user.is_admin) {
      options.isPublished = true;
    }
    
    const agendas = await Agenda.getAll(options);
    const total = await Agenda.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      agendas,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all agendas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan agenda berdasarkan ID
exports.getAgendaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const agenda = await Agenda.getById(id);
    
    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: 'Agenda tidak ditemukan'
      });
    }
    
    // Jika user tidak login atau bukan admin dan agenda belum dipublish
    if ((!req.user || !req.user.is_admin) && !agenda.is_published) {
      return res.status(403).json({
        success: false,
        message: 'Agenda tidak tersedia'
      });
    }
    
    res.json({
      success: true,
      agenda
    });
  } catch (error) {
    console.error('Get agenda by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat agenda baru (admin only)
exports.createAgenda = async (req, res) => {
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
      description, 
      location, 
      start_date, 
      end_date, 
      is_published 
    } = req.body;
    
    // Validasi tanggal
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
      });
    }
    
    // Persiapkan data agenda
    const agendaData = {
      title,
      description,
      location,
      start_date,
      end_date,
      is_published: is_published === 'true' || is_published === true,
      created_by: req.user.id
    };
    
    // Buat agenda baru
    const newAgenda = await Agenda.create(agendaData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Agenda berhasil dibuat',
      agenda: newAgenda
    });
  } catch (error) {
    console.error('Create agenda error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update agenda (admin only)
exports.updateAgenda = async (req, res) => {
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
      description, 
      location, 
      start_date, 
      end_date, 
      is_published 
    } = req.body;
    
    // Cek apakah agenda ada
    const agenda = await Agenda.getById(id);
    
    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: 'Agenda tidak ditemukan'
      });
    }
    
    // Validasi tanggal jika keduanya disediakan
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
        });
      }
    }
    
    // Persiapkan data update
    const agendaData = {
      title: title || agenda.title,
      description: description || agenda.description,
      location: location || agenda.location,
      start_date: start_date || agenda.start_date,
      end_date: end_date || agenda.end_date,
      is_published: is_published !== undefined ? 
        (is_published === 'true' || is_published === true) : agenda.is_published
    };
    
    // Update agenda
    const updatedAgenda = await Agenda.update(id, agendaData, req.file);
    
    res.json({
      success: true,
      message: 'Agenda berhasil diupdate',
      agenda: updatedAgenda
    });
  } catch (error) {
    console.error('Update agenda error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus agenda (admin only)
exports.deleteAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah agenda ada
    const agenda = await Agenda.getById(id);
    
    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: 'Agenda tidak ditemukan'
      });
    }
    
    const success = await Agenda.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus agenda'
      });
    }
    
    res.json({
      success: true,
      message: 'Agenda berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete agenda error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Toggle status publikasi
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    
    if (is_published === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status publikasi harus disediakan'
      });
    }
    
    // Cek apakah agenda ada
    const agenda = await Agenda.getById(id);
    
    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: 'Agenda tidak ditemukan'
      });
    }
    
    const isPublished = is_published === 'true' || is_published === true;
    
    // Update status publikasi
    const success = await Agenda.togglePublishStatus(id, isPublished);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengubah status publikasi'
      });
    }
    
    res.json({
      success: true,
      message: `Agenda berhasil ${isPublished ? 'dipublikasikan' : 'disembunyikan'}`
    });
  } catch (error) {
    console.error('Toggle publish status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};