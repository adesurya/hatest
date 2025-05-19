// Modifikasi pada doctorController.js untuk menangani path file frontend

const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi multer untuk upload file - tetap menggunakan memoryStorage()
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Cek field untuk menentukan jenis file yang diterima
    if (file.fieldname === 'profile_photo') {
      const allowedTypes = ['.jpg', '.jpeg', '.png'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Format file foto profil tidak didukung. Gunakan JPG, JPEG, atau PNG.'));
      }
    } else if (file.fieldname === 'supporting_document') {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Format file dokumen pendukung tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG.'));
      }
    } else {
      cb(new Error('Field tidak dikenali'));
    }
  }
}).fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'supporting_document', maxCount: 1 }
]);

// Middleware upload file - tidak ada perubahan
exports.uploadFiles = (req, res, next) => {
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

// Dapatkan semua data dokter - tidak ada perubahan
exports.getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const verificationStatus = req.query.verification_status;
    const specialization = req.query.specialization;
    const search = req.query.search;
    
    const options = {
      page,
      limit,
      verificationStatus,
      specialization,
      search
    };
    
    const doctors = await Doctor.getAll(options);
    const total = await Doctor.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      doctors,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan dokter berdasarkan ID - tidak ada perubahan
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await Doctor.getById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }
    
    // Dapatkan juga riwayat verifikasi jika user adalah admin
    let verificationHistory = [];
    if (req.user && req.user.is_admin) {
      verificationHistory = await Doctor.getVerificationHistory(id);
    }
    
    res.json({
      success: true,
      doctor,
      verification_history: verificationHistory
    });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat data dokter baru (admin only) - PERUBAHAN untuk path file frontend
exports.createDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      full_name, 
      str_number, 
      nik_number, 
      gender, 
      birth_date, 
      birth_place, 
      address, 
      phone_number, 
      email, 
      membership_status, 
      specialization, 
      education_institution, 
      graduation_year, 
      practice_location, 
      longitude, 
      latitude, 
      verification_status,
      // Tambahkan field path file dari frontend
      profile_photo_path,
      supporting_document_path
    } = req.body;
    
    // Cek apakah STR number sudah digunakan
    const strExists = await Doctor.checkSTRExist(str_number);
    if (strExists) {
      return res.status(400).json({
        success: false,
        message: 'Nomor STR sudah terdaftar'
      });
    }
    
    // Cek apakah NIK number sudah digunakan
    const nikExists = await Doctor.checkNIKExist(nik_number);
    if (nikExists) {
      return res.status(400).json({
        success: false,
        message: 'Nomor NIK sudah terdaftar'
      });
    }
    
    // Cek apakah email sudah digunakan
    const emailExists = await Doctor.checkEmailExist(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }
    
    // Persiapkan data dokter
    const doctorData = {
      full_name,
      str_number,
      nik_number,
      gender,
      birth_date,
      birth_place,
      address,
      phone_number,
      email,
      membership_status,
      specialization,
      education_institution,
      graduation_year,
      practice_location,
      longitude,
      latitude,
      verification_status: verification_status || 'Belum Terverifikasi',
      created_by: req.user.id
    };
    
    // Ambil file yang diupload
    const profilePhoto = req.files && req.files.profile_photo ? req.files.profile_photo[0] : null;
    const supportingDocument = req.files && req.files.supporting_document ? req.files.supporting_document[0] : null;
    
    // Log informasi untuk debugging
    console.log("Create doctor - File information:");
    console.log("- Profile photo from upload:", profilePhoto ? "Yes" : "No");
    console.log("- Supporting document from upload:", supportingDocument ? "Yes" : "No");
    console.log("- Frontend profile_photo_path:", profile_photo_path);
    console.log("- Frontend supporting_document_path:", supporting_document_path);
    
    // PERUBAHAN: Tambahkan parameter untuk path file
    const newDoctor = await Doctor.create(
      doctorData, 
      profilePhoto, 
      supportingDocument, 
      profile_photo_path, 
      supporting_document_path
    );
    
    res.status(201).json({
      success: true,
      message: 'Data dokter berhasil dibuat',
      doctor: newDoctor
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update data dokter (admin only) - PERUBAHAN untuk path file frontend
exports.updateDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    
    // Cek apakah dokter ada
    const doctor = await Doctor.getById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }
    
    const { 
      full_name, 
      str_number, 
      nik_number, 
      gender, 
      birth_date, 
      birth_place, 
      address, 
      phone_number, 
      email, 
      membership_status, 
      specialization, 
      education_institution, 
      graduation_year, 
      practice_location, 
      longitude, 
      latitude, 
      verification_status,
      verification_notes,
      // Tambahkan field path file dari frontend
      profile_photo_path,
      supporting_document_path,
      // Flag untuk menghapus foto profil
      remove_profile
    } = req.body;
    
    // Cek apakah STR number sudah digunakan oleh dokter lain
    if (str_number !== doctor.str_number) {
      const strExists = await Doctor.checkSTRExist(str_number, id);
      if (strExists) {
        return res.status(400).json({
          success: false,
          message: 'Nomor STR sudah terdaftar oleh dokter lain'
        });
      }
    }
    
    // Cek apakah NIK number sudah digunakan oleh dokter lain
    if (nik_number !== doctor.nik_number) {
      const nikExists = await Doctor.checkNIKExist(nik_number, id);
      if (nikExists) {
        return res.status(400).json({
          success: false,
          message: 'Nomor NIK sudah terdaftar oleh dokter lain'
        });
      }
    }
    
    // Cek apakah email sudah digunakan oleh dokter lain
    if (email !== doctor.email) {
      const emailExists = await Doctor.checkEmailExist(email, id);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar oleh dokter lain'
        });
      }
    }
    
    // Persiapkan data update
    const doctorData = {
      full_name: full_name || doctor.full_name,
      str_number: str_number || doctor.str_number,
      nik_number: nik_number || doctor.nik_number,
      gender: gender || doctor.gender,
      birth_date: birth_date || doctor.birth_date,
      birth_place: birth_place || doctor.birth_place,
      address: address || doctor.address,
      phone_number: phone_number || doctor.phone_number,
      email: email || doctor.email,
      membership_status: membership_status || doctor.membership_status,
      specialization: specialization || doctor.specialization,
      education_institution: education_institution || doctor.education_institution,
      graduation_year: graduation_year || doctor.graduation_year,
      practice_location: practice_location || doctor.practice_location,
      longitude: longitude || doctor.longitude,
      latitude: latitude || doctor.latitude,
      verification_status: verification_status || doctor.verification_status,
      verification_notes: verification_notes,
      updated_by: req.user.id,
      // Tambahkan flag untuk menghapus foto profil
      remove_profile: remove_profile === '1'
    };
    
    // Ambil file yang diupload
    const profilePhoto = req.files && req.files.profile_photo ? req.files.profile_photo[0] : null;
    const supportingDocument = req.files && req.files.supporting_document ? req.files.supporting_document[0] : null;
    
    // Log informasi untuk debugging
    console.log("Update doctor - File information:");
    console.log("- Profile photo from upload:", profilePhoto ? "Yes" : "No");
    console.log("- Supporting document from upload:", supportingDocument ? "Yes" : "No");
    console.log("- Frontend profile_photo_path:", profile_photo_path);
    console.log("- Frontend supporting_document_path:", supporting_document_path);
    console.log("- Remove profile flag:", remove_profile);
    
    // PERUBAHAN: Tambahkan parameter untuk path file
    const updatedDoctor = await Doctor.update(
      id, 
      doctorData, 
      profilePhoto, 
      supportingDocument, 
      profile_photo_path, 
      supporting_document_path
    );
    
    res.json({
      success: true,
      message: 'Data dokter berhasil diupdate',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update status verifikasi dokter (admin only) - tidak ada perubahan
exports.updateVerificationStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { verification_status, notes } = req.body;
    
    // Validasi status verifikasi
    if (!['Terverifikasi', 'Belum Terverifikasi', 'Ditolak'].includes(verification_status)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi tidak valid'
      });
    }
    
    // Cek apakah dokter ada
    const doctor = await Doctor.getById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }
    
    // Update status verifikasi
    const success = await Doctor.updateVerificationStatus(id, verification_status, notes, req.user.id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate status verifikasi dokter'
      });
    }
    
    res.json({
      success: true,
      message: `Status verifikasi dokter berhasil diubah menjadi ${verification_status}`
    });
  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan riwayat verifikasi dokter (admin only) - tidak ada perubahan
exports.getVerificationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah dokter ada
    const doctor = await Doctor.getById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }
    
    // Dapatkan riwayat verifikasi
    const history = await Doctor.getVerificationHistory(id);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus dokter (admin only) - tidak ada perubahan
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah dokter ada
    const doctor = await Doctor.getById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }
    
    // Hapus dokter
    const success = await Doctor.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus dokter'
      });
    }
    
    res.json({
      success: true,
      message: 'Dokter berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};