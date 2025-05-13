const { body } = require('express-validator');

// Validasi untuk pembuatan profile dokter muda
exports.createProfileValidation = [
  // Hapus validasi user_id karena akan digenerate otomatis
  
  body('nama_lengkap')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('nomor_str')
    .trim()
    .notEmpty().withMessage('Nomor STR wajib diisi')
    .isLength({ min: 5, max: 50 }).withMessage('Nomor STR harus antara 5-50 karakter')
    .custom(value => {
      // Menerima format dengan atau tanpa titik
      // Menghapus semua titik dan memeriksa hasilnya
      const cleanedValue = value.replace(/\./g, '');
      if (!/^[0-9a-zA-Z]+$/.test(cleanedValue)) {
        throw new Error('Nomor STR hanya boleh berisi angka dan huruf');
      }
      return true;
    }),
    
  body('nomor_nik')
    .trim()
    .notEmpty().withMessage('Nomor NIK wajib diisi')
    .isLength({ min: 16, max: 16 }).withMessage('Nomor NIK harus 16 digit')
    .isNumeric().withMessage('Nomor NIK harus berupa angka'),
    
  body('jenis_kelamin')
    .trim()
    .notEmpty().withMessage('Jenis kelamin wajib diisi')
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin harus Laki-laki atau Perempuan'),
    
  body('tanggal_lahir')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .isDate().withMessage('Format tanggal lahir tidak valid'),
    
  body('tempat_lahir')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Tempat lahir harus antara 3-100 karakter'),
    
  body('alamat_tinggal')
    .trim()
    .notEmpty().withMessage('Alamat tempat tinggal wajib diisi')
    .isLength({ min: 10, max: 500 }).withMessage('Alamat harus antara 10-500 karakter'),
    
  body('no_hp')
    .trim()
    .notEmpty().withMessage('Nomor HP wajib diisi')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('status_keanggotaan')
    .trim()
    .optional()
    .isIn(['Aktif', 'Tidak Aktif', 'Ditangguhkan']).withMessage('Status keanggotaan tidak valid'),
    
  body('spesialisasi')
    .trim()
    .notEmpty().withMessage('Spesialisasi wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Spesialisasi harus antara 3-100 karakter'),
    
  body('institusi_pendidikan')
    .trim()
    .notEmpty().withMessage('Institusi pendidikan wajib diisi')
    .isLength({ min: 3, max: 150 }).withMessage('Institusi pendidikan harus antara 3-150 karakter'),
    
  body('tahun_lulus')
    .trim()
    .notEmpty().withMessage('Tahun lulus wajib diisi')
    .isInt({ min: 1950, max: new Date().getFullYear() }).withMessage('Tahun lulus tidak valid'),
    
  body('lokasi_praktek')
    .trim()
    .notEmpty().withMessage('Lokasi praktek wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Lokasi praktek harus antara 5-200 karakter'),
    
  body('koordinat_longitude')
    .trim()
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Koordinat longitude harus antara -180 sampai 180'),
    
  body('koordinat_latitude')
    .trim()
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Koordinat latitude harus antara -90 sampai 90'),
    
  body('status_verifikasi')
    .trim()
    .optional()
    .isIn(['Pending', 'Verified', 'Rejected']).withMessage('Status verifikasi tidak valid')
];

// Validasi untuk update profile dokter muda
exports.updateProfileValidation = [
  body('nama_lengkap')
    .trim()
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('nomor_str')
    .trim()
    .optional()
    .isLength({ min: 5, max: 50 }).withMessage('Nomor STR harus antara 5-50 karakter'),
    
  body('nomor_nik')
    .trim()
    .optional()
    .isLength({ min: 16, max: 16 }).withMessage('Nomor NIK harus 16 digit')
    .isNumeric().withMessage('Nomor NIK harus berupa angka'),
    
  body('jenis_kelamin')
    .trim()
    .optional()
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin harus Laki-laki atau Perempuan'),
    
  body('tanggal_lahir')
    .trim()
    .optional()
    .isDate().withMessage('Format tanggal lahir tidak valid'),
    
  body('tempat_lahir')
    .trim()
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Tempat lahir harus antara 3-100 karakter'),
    
  body('alamat_tinggal')
    .trim()
    .optional()
    .isLength({ min: 10, max: 500 }).withMessage('Alamat harus antara 10-500 karakter'),
    
  body('no_hp')
    .trim()
    .optional()
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    
  body('email')
    .trim()
    .optional()
    .isEmail().withMessage('Format email tidak valid'),
    
  body('status_keanggotaan')
    .trim()
    .optional()
    .isIn(['Aktif', 'Tidak Aktif', 'Ditangguhkan']).withMessage('Status keanggotaan tidak valid'),
    
  body('spesialisasi')
    .trim()
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Spesialisasi harus antara 3-100 karakter'),
    
  body('institusi_pendidikan')
    .trim()
    .optional()
    .isLength({ min: 3, max: 150 }).withMessage('Institusi pendidikan harus antara 3-150 karakter'),
    
  body('tahun_lulus')
    .trim()
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() }).withMessage('Tahun lulus tidak valid'),
    
  body('lokasi_praktek')
    .trim()
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('Lokasi praktek harus antara 5-200 karakter'),
    
  body('koordinat_longitude')
    .trim()
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Koordinat longitude harus antara -180 sampai 180'),
    
  body('koordinat_latitude')
    .trim()
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Koordinat latitude harus antara -90 sampai 90'),
    
  body('status_verifikasi')
    .trim()
    .optional()
    .isIn(['Pending', 'Verified', 'Rejected']).withMessage('Status verifikasi tidak valid')
];

// Validasi untuk update status verifikasi
exports.updateStatusValidation = [
  body('status_verifikasi')
    .trim()
    .notEmpty().withMessage('Status verifikasi wajib diisi')
    .isIn(['Pending', 'Verified', 'Rejected']).withMessage('Status verifikasi tidak valid')
];