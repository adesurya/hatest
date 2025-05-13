const KurikulumPendidikan = require('../models/KurikulumPendidikan');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, PPT, atau PPTX.'));
    }
  }
}).single('file_kurikulum');

// Middleware upload file
exports.uploadDocument = (req, res, next) => {
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

// Dapatkan semua kurikulum dengan pagination
exports.getAllKurikulum = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const namaFakultas = req.query.fakultas;
    const tahun = req.query.tahun;
    
    const options = {
      page,
      limit,
      namaFakultas,
      tahun
    };
    
    const kurikulums = await KurikulumPendidikan.getAll(options);
    const total = await KurikulumPendidikan.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      kurikulums,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all kurikulum error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan kurikulum berdasarkan ID
exports.getKurikulumById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kurikulum = await KurikulumPendidikan.getById(id);
    
    if (!kurikulum) {
      return res.status(404).json({
        success: false,
        message: 'Kurikulum tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      kurikulum
    });
  } catch (error) {
    console.error('Get kurikulum by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat kurikulum baru (admin only)
exports.createKurikulum = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      nama_fakultas,
      tahun_kurikulum,
      deskripsi_kurikulum,
      biaya_semester,
      catatan
    } = req.body;
    
    // Buat data kurikulum
    const kurikulumData = {
      nama_fakultas,
      tahun_kurikulum,
      deskripsi_kurikulum,
      biaya_semester,
      catatan,
      created_by: req.user.id
    };
    
    // Buat kurikulum baru
    const newKurikulum = await KurikulumPendidikan.create(kurikulumData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Kurikulum berhasil dibuat',
      kurikulum: newKurikulum
    });
  } catch (error) {
    console.error('Create kurikulum error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update kurikulum (admin only)
exports.updateKurikulum = async (req, res) => {
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
      nama_fakultas,
      tahun_kurikulum,
      deskripsi_kurikulum,
      biaya_semester,
      catatan
    } = req.body;
    
    // Cek apakah kurikulum ada
    const kurikulum = await KurikulumPendidikan.getById(id);
    
    if (!kurikulum) {
      return res.status(404).json({
        success: false,
        message: 'Kurikulum tidak ditemukan'
      });
    }
    
    // Persiapkan data update
    const kurikulumData = {
      nama_fakultas: nama_fakultas || kurikulum.nama_fakultas,
      tahun_kurikulum: tahun_kurikulum || kurikulum.tahun_kurikulum,
      deskripsi_kurikulum: deskripsi_kurikulum !== undefined ? deskripsi_kurikulum : kurikulum.deskripsi_kurikulum,
      biaya_semester: biaya_semester || kurikulum.biaya_semester,
      catatan: catatan !== undefined ? catatan : kurikulum.catatan
    };
    
    // Update kurikulum
    const updatedKurikulum = await KurikulumPendidikan.update(id, kurikulumData, req.file);
    
    res.json({
      success: true,
      message: 'Kurikulum berhasil diupdate',
      kurikulum: updatedKurikulum
    });
  } catch (error) {
    console.error('Update kurikulum error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus kurikulum (admin only)
exports.deleteKurikulum = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah kurikulum ada
    const kurikulum = await KurikulumPendidikan.getById(id);
    
    if (!kurikulum) {
      return res.status(404).json({
        success: false,
        message: 'Kurikulum tidak ditemukan'
      });
    }
    
    const success = await KurikulumPendidikan.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus kurikulum'
      });
    }
    
    res.json({
      success: true,
      message: 'Kurikulum berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete kurikulum error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};