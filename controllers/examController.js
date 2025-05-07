const Exam = require('../models/Exam');
const ExamCategory = require('../models/ExamCategory');
const ExamRegistration = require('../models/ExamRegistration');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database'); // Tambahkan import pool

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG.'));
    }
  }
}).single('supporting_document');

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

// Dapatkan semua ujian
exports.getAllExams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.category;
    
    const options = {
      page,
      limit,
      categoryId
    };
    
    const exams = await Exam.getAll(options);
    const total = await Exam.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      exams,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan ujian berdasarkan ID
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exam = await Exam.getById(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Ujian tidak ditemukan'
      });
    }
    
    // Jika user yang login bukan admin, cek apakah sudah mendaftar
    if (req.user && !req.user.is_admin) {
      const isRegistered = await ExamRegistration.checkUserRegistered(req.user.id, id);
      exam.is_registered = isRegistered;
    }
    
    res.json({
      success: true,
      exam
    });
  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat ujian baru (admin only)
exports.createExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      name, 
      category_id, 
      description, 
      requirements, 
      location, 
      exam_date, 
      fee 
    } = req.body;
    
    // Cek apakah kategori ujian valid
    const category = await ExamCategory.getById(category_id);
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Kategori ujian tidak valid'
      });
    }
    
    // Persiapkan data ujian
    const examData = {
      name,
      category_id,
      description,
      requirements,
      location,
      exam_date,
      fee,
      created_by: req.user.id
    };
    
    // Buat ujian baru
    const newExam = await Exam.create(examData, req.file);
    
    res.status(201).json({
      success: true,
      message: 'Ujian berhasil dibuat',
      exam: newExam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update ujian (admin only)
exports.updateExam = async (req, res) => {
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
      name, 
      category_id, 
      description, 
      requirements, 
      location, 
      exam_date, 
      fee 
    } = req.body;
    
    // Cek apakah ujian ada
    const exam = await Exam.getById(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Ujian tidak ditemukan'
      });
    }
    
    // Cek apakah kategori ujian valid
    if (category_id) {
      const category = await ExamCategory.getById(category_id);
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Kategori ujian tidak valid'
        });
      }
    }
    
    // Persiapkan data update
    const examData = {
      name: name || exam.name,
      category_id: category_id || exam.category_id,
      description: description || exam.description,
      requirements: requirements || exam.requirements,
      location: location || exam.location,
      exam_date: exam_date || exam.exam_date,
      fee: fee || exam.fee
    };
    
    // Update ujian
    const updatedExam = await Exam.update(id, examData, req.file);
    
    res.json({
      success: true,
      message: 'Ujian berhasil diupdate',
      exam: updatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus ujian (admin only)
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah ujian ada
    const exam = await Exam.getById(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Ujian tidak ditemukan'
      });
    }
    
    try {
      const success = await Exam.delete(id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Gagal menghapus ujian'
        });
      }
      
      res.json({
        success: true,
        message: 'Ujian berhasil dihapus'
      });
    } catch (deleteError) {
      if (deleteError.message.includes('sudah ada pendaftaran')) {
        return res.status(400).json({
          success: false,
          message: 'Ujian tidak dapat dihapus karena sudah ada pendaftaran'
        });
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Daftar ujian (user)
exports.registerExam = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah ujian ada
    const exam = await Exam.getById(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Ujian tidak ditemukan'
      });
    }
    
    // Cek apakah user sudah mendaftar
    const isRegistered = await ExamRegistration.checkUserRegistered(req.user.id, id);
    
    if (isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah mendaftar untuk ujian ini'
      });
    }
    
    // Cek apakah tanggal ujian sudah lewat
    const examDate = new Date(exam.exam_date);
    const now = new Date();
    
    if (examDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Ujian ini sudah berakhir'
      });
    }
    
    // Daftar ke ujian
    const [result] = await pool.query(
      'INSERT INTO exam_registrations (user_id, exam_id, status) VALUES (?, ?, "registered")',
      [req.user.id, id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Berhasil mendaftar ujian',
      registration_id: result.insertId
    });
  } catch (error) {
    console.error('Register exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan pendaftaran ujian user
exports.getUserExamRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const registrations = await ExamRegistration.getUserRegistrations(userId);
    
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Get user exam registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};