const DokterMudaProfile = require('../models/DokterMudaProfile');
const User = require('../models/User');
const { pool } = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'foto_profil') {
      const allowedTypes = ['.jpg', '.jpeg', '.png'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Format file foto tidak didukung. Gunakan JPG, JPEG, atau PNG.'));
      }
    } else if (file.fieldname === 'dokumen_pendukung') {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Format file dokumen tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG.'));
      }
    } else {
      cb(new Error('Field file tidak dikenali.'));
    }
  }
}).fields([
  { name: 'foto_profil', maxCount: 1 },
  { name: 'dokumen_pendukung', maxCount: 1 }
]);

// Middleware upload file
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

// Update profile dokter muda (admin only)
exports.updateProfile = async (req, res) => {
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
      nama_lengkap, 
      nomor_str, 
      nomor_nik, 
      jenis_kelamin, 
      tanggal_lahir, 
      tempat_lahir, 
      alamat_tinggal, 
      no_hp, 
      email, 
      status_keanggotaan, 
      spesialisasi, 
      institusi_pendidikan, 
      tahun_lulus, 
      lokasi_praktek, 
      koordinat_longitude, 
      koordinat_latitude, 
      status_verifikasi 
    } = req.body;
    
    // Cek apakah profile ada
    const profile = await DokterMudaProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile dokter muda tidak ditemukan'
      });
    }
    
    // Cek apakah nomor STR sudah digunakan oleh profile lain
    if (nomor_str !== profile.nomor_str) {
      const [strCheck] = await pool.query(
        'SELECT id FROM dokter_muda_profiles WHERE nomor_str = ? AND id != ?',
        [nomor_str, id]
      );
      
      if (strCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Nomor STR sudah digunakan'
        });
      }
    }
    
    // Cek apakah nomor NIK sudah digunakan oleh profile lain
    if (nomor_nik !== profile.nomor_nik) {
      const [nikCheck] = await pool.query(
        'SELECT id FROM dokter_muda_profiles WHERE nomor_nik = ? AND id != ?',
        [nomor_nik, id]
      );
      
      if (nikCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Nomor NIK sudah digunakan'
        });
      }
    }
    
    // Cek apakah email sudah digunakan oleh profile lain
    if (email !== profile.email) {
      const [emailCheck] = await pool.query(
        'SELECT id FROM dokter_muda_profiles WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan di profile lain'
        });
      }
    }
    
    const profileData = {
      nama_lengkap: nama_lengkap || profile.nama_lengkap,
      nomor_str: nomor_str || profile.nomor_str,
      nomor_nik: nomor_nik || profile.nomor_nik,
      jenis_kelamin: jenis_kelamin || profile.jenis_kelamin,
      tanggal_lahir: tanggal_lahir || profile.tanggal_lahir,
      tempat_lahir: tempat_lahir || profile.tempat_lahir,
      alamat_tinggal: alamat_tinggal || profile.alamat_tinggal,
      no_hp: no_hp || profile.no_hp,
      email: email || profile.email,
      status_keanggotaan: status_keanggotaan || profile.status_keanggotaan,
      spesialisasi: spesialisasi || profile.spesialisasi,
      institusi_pendidikan: institusi_pendidikan || profile.institusi_pendidikan,
      tahun_lulus: tahun_lulus || profile.tahun_lulus,
      lokasi_praktek: lokasi_praktek || profile.lokasi_praktek,
      koordinat_longitude: koordinat_longitude !== undefined ? koordinat_longitude : profile.koordinat_longitude,
      koordinat_latitude: koordinat_latitude !== undefined ? koordinat_latitude : profile.koordinat_latitude,
      status_verifikasi: status_verifikasi || profile.status_verifikasi
    };
    
    // Ambil file dari request jika ada
    const fotoProfil = req.files && req.files.foto_profil ? req.files.foto_profil[0] : null;
    const dokumenPendukung = req.files && req.files.dokumen_pendukung ? req.files.dokumen_pendukung[0] : null;
    
    // Update profile
    const updatedProfile = await DokterMudaProfile.update(id, profileData, fotoProfil, dokumenPendukung);
    
    // Sanitasi data response
    const sanitizedProfile = { ...updatedProfile };
    
    if (sanitizedProfile.foto_profil) {
      sanitizedProfile.foto_profil_url = `${process.env.BASE_URL}${sanitizedProfile.foto_profil}`;
    }
    
    if (sanitizedProfile.dokumen_pendukung) {
      sanitizedProfile.dokumen_pendukung_url = `${process.env.BASE_URL}${sanitizedProfile.dokumen_pendukung}`;
    }
    
    res.json({
      success: true,
      message: 'Profile dokter muda berhasil diupdate',
      profile: sanitizedProfile
    });
  } catch (error) {
    console.error('Update dokter muda profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update status verifikasi profile dokter muda (admin only)
exports.updateStatusVerifikasi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { status_verifikasi } = req.body;
    
    // Validasi status verifikasi
    if (!['Pending', 'Verified', 'Rejected'].includes(status_verifikasi)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi tidak valid'
      });
    }
    
    // Cek apakah profile ada
    const profile = await DokterMudaProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile dokter muda tidak ditemukan'
      });
    }
    
    // Update status verifikasi
    const success = await DokterMudaProfile.updateStatus(id, status_verifikasi);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate status verifikasi'
      });
    }
    
    res.json({
      success: true,
      message: `Status verifikasi berhasil diupdate menjadi ${status_verifikasi}`
    });
  } catch (error) {
    console.error('Update status verifikasi error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus profile dokter muda (admin only)
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah profile ada
    const profile = await DokterMudaProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile dokter muda tidak ditemukan'
      });
    }
    
    // Hapus profile
    const success = await DokterMudaProfile.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus profile dokter muda'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile dokter muda berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete dokter muda profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan semua profile dokter muda
exports.getAllProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status_verifikasi = req.query.status_verifikasi;
    const status_keanggotaan = req.query.status_keanggotaan;
    const spesialisasi = req.query.spesialisasi;
    const nama = req.query.nama;
    
    const options = {
      page,
      limit,
      status_verifikasi,
      status_keanggotaan,
      spesialisasi,
      nama
    };
    
    const profiles = await DokterMudaProfile.getAll(options);
    const total = await DokterMudaProfile.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    // Sanitasi data response untuk menghapus path lengkap file
    const sanitizedProfiles = profiles.map(profile => {
      const sanitizedProfile = { ...profile };
      
      if (sanitizedProfile.foto_profil) {
        sanitizedProfile.foto_profil_url = `${process.env.BASE_URL}${sanitizedProfile.foto_profil}`;
      }
      
      if (sanitizedProfile.dokumen_pendukung) {
        sanitizedProfile.dokumen_pendukung_url = `${process.env.BASE_URL}${sanitizedProfile.dokumen_pendukung}`;
      }
      
      return sanitizedProfile;
    });
    
    res.json({
      success: true,
      profiles: sanitizedProfiles,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all dokter muda profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan profile dokter muda berdasarkan ID
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await DokterMudaProfile.getById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile dokter muda tidak ditemukan'
      });
    }
    
    // Sanitasi data response
    const sanitizedProfile = { ...profile };
    
    if (sanitizedProfile.foto_profil) {
      sanitizedProfile.foto_profil_url = `${process.env.BASE_URL}${sanitizedProfile.foto_profil}`;
    }
    
    if (sanitizedProfile.dokumen_pendukung) {
      sanitizedProfile.dokumen_pendukung_url = `${process.env.BASE_URL}${sanitizedProfile.dokumen_pendukung}`;
    }
    
    res.json({
      success: true,
      profile: sanitizedProfile
    });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan profile dokter muda berdasarkan User ID
exports.getProfileByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Cek apakah user ada
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    const profile = await DokterMudaProfile.getByUserId(user_id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile dokter muda tidak ditemukan'
      });
    }
    
    // Sanitasi data response
    const sanitizedProfile = { ...profile };
    
    if (sanitizedProfile.foto_profil) {
      sanitizedProfile.foto_profil_url = `${process.env.BASE_URL}${sanitizedProfile.foto_profil}`;
    }
    
    if (sanitizedProfile.dokumen_pendukung) {
      sanitizedProfile.dokumen_pendukung_url = `${process.env.BASE_URL}${sanitizedProfile.dokumen_pendukung}`;
    }
    
    res.json({
      success: true,
      profile: sanitizedProfile
    });
  } catch (error) {
    console.error('Get profile by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat profile dokter muda baru (admin only)
exports.createProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      nama_lengkap, 
      nomor_str, 
      nomor_nik, 
      jenis_kelamin, 
      tanggal_lahir, 
      tempat_lahir, 
      alamat_tinggal, 
      no_hp, 
      email, 
      status_keanggotaan, 
      spesialisasi, 
      institusi_pendidikan, 
      tahun_lulus, 
      lokasi_praktek, 
      koordinat_longitude, 
      koordinat_latitude, 
      status_verifikasi 
    } = req.body;
    
    // Generate user_id berdasarkan user_id terakhir + 1
    const [lastUser] = await pool.query(
      'SELECT id FROM users ORDER BY id DESC LIMIT 1'
    );
    
    let user_id;
    
    if (lastUser.length > 0) {
      user_id = lastUser[0].id + 1;
    } else {
      user_id = 1; // Jika belum ada user sama sekali
    }
    
    // Cek apakah nomor STR sudah digunakan
    // Format STR: hilangkan semua titik untuk memeriksa keunikan
    const cleanedSTR = nomor_str.replace(/\./g, '');
    
    const [strCheck] = await pool.query(
      'SELECT id FROM dokter_muda_profiles WHERE REPLACE(nomor_str, ".", "") = ?',
      [cleanedSTR]
    );
    
    if (strCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nomor STR sudah digunakan'
      });
    }
    
    // Cek apakah nomor NIK sudah digunakan
    const [nikCheck] = await pool.query(
      'SELECT id FROM dokter_muda_profiles WHERE nomor_nik = ?',
      [nomor_nik]
    );
    
    if (nikCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nomor NIK sudah digunakan'
      });
    }
    
    // Cek apakah email sudah digunakan
    const [emailCheck] = await pool.query(
      'SELECT id FROM dokter_muda_profiles WHERE email = ?',
      [email]
    );
    
    
    // Buat user baru terlebih dahulu
    const [userResult] = await pool.query(
      `INSERT INTO users 
      (full_name, email, phone_number, password, birth_place, birth_date, category_id, is_verified) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_lengkap,
        email,
        no_hp,
        // Generate password random yang nanti bisa direset
        await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        tempat_lahir,
        tanggal_lahir,
        2, // 2 adalah dokterMuda sesuai kategori yang sudah ada
        true // Langsung diverifikasi
      ]
    );
    
    // Ambil user_id dari hasil insert
    user_id = userResult.insertId;
    
    const profileData = {
      user_id,
      nama_lengkap,
      nomor_str,
      nomor_nik,
      jenis_kelamin,
      tanggal_lahir,
      tempat_lahir,
      alamat_tinggal,
      no_hp,
      email,
      status_keanggotaan: status_keanggotaan || 'Aktif',
      spesialisasi,
      institusi_pendidikan,
      tahun_lulus,
      lokasi_praktek,
      koordinat_longitude,
      koordinat_latitude,
      status_verifikasi: status_verifikasi || 'Pending'
    };
    
    // Ambil file dari request jika ada
    const fotoProfil = req.files && req.files.foto_profil ? req.files.foto_profil[0] : null;
    const dokumenPendukung = req.files && req.files.dokumen_pendukung ? req.files.dokumen_pendukung[0] : null;
    
    // Buat profile baru
    const newProfile = await DokterMudaProfile.create(profileData, fotoProfil, dokumenPendukung);
    
    // Sanitasi data response
    const sanitizedProfile = { ...newProfile };
    
    if (sanitizedProfile.foto_profil) {
      sanitizedProfile.foto_profil_url = `${process.env.BASE_URL}${sanitizedProfile.foto_profil}`;
    }
    
    if (sanitizedProfile.dokumen_pendukung) {
      sanitizedProfile.dokumen_pendukung_url = `${process.env.BASE_URL}${sanitizedProfile.dokumen_pendukung}`;
    }
    
    res.status(201).json({
      success: true,
      message: 'Profile dokter muda berhasil dibuat',
      profile: sanitizedProfile
    });
  } catch (error) {
    console.error('Create dokter muda profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};