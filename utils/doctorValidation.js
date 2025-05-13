const { body } = require('express-validator');

// Validasi untuk pembuatan data dokter
exports.createDoctorValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('str_number')
    .trim()
    .notEmpty().withMessage('Nomor STR wajib diisi')
    .matches(/^[0-9]{6,20}$/).withMessage('Nomor STR harus berupa angka dengan panjang 6-20 digit'),
    
  body('nik_number')
    .trim()
    .notEmpty().withMessage('Nomor NIK wajib diisi')
    .matches(/^[0-9]{16}$/).withMessage('Nomor NIK harus berupa 16 digit angka'),
    
  body('gender')
    .trim()
    .notEmpty().withMessage('Jenis kelamin wajib diisi')
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin harus Laki-laki atau Perempuan'),
    
  body('birth_date')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .isDate().withMessage('Format tanggal lahir tidak valid'),
    
  body('birth_place')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Tempat lahir harus antara 3-100 karakter'),
    
  body('address')
    .trim()
    .notEmpty().withMessage('Alamat tempat tinggal wajib diisi')
    .isLength({ min: 10, max: 500 }).withMessage('Alamat tempat tinggal harus antara 10-500 karakter'),
    
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Nomor HP wajib diisi')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('membership_status')
    .trim()
    .notEmpty().withMessage('Status keanggotaan wajib diisi')
    .isIn(['Aktif', 'Tidak Aktif', 'Ditangguhkan']).withMessage('Status keanggotaan harus Aktif, Tidak Aktif, atau Ditangguhkan'),
    
  body('specialization')
    .trim()
    .notEmpty().withMessage('Spesialisasi wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Spesialisasi harus antara 3-100 karakter'),
    
  body('education_institution')
    .trim()
    .notEmpty().withMessage('Institusi pendidikan wajib diisi')
    .isLength({ min: 3, max: 200 }).withMessage('Institusi pendidikan harus antara 3-200 karakter'),
    
  body('graduation_year')
    .trim()
    .notEmpty().withMessage('Tahun lulus wajib diisi')
    .matches(/^[0-9]{4}$/).withMessage('Tahun lulus harus berupa 4 digit angka')
    .custom(value => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        throw new Error(`Tahun lulus harus antara 1900 dan ${currentYear}`);
      }
      return true;
    }),
    
  body('practice_location')
    .trim()
    .notEmpty().withMessage('Lokasi praktek wajib diisi')
    .isLength({ min: 5, max: 500 }).withMessage('Lokasi praktek harus antara 5-500 karakter'),
    
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Koordinat longitude harus antara -180 dan 180'),
    
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Koordinat latitude harus antara -90 dan 90'),
    
  body('verification_status')
    .optional()
    .isIn(['Terverifikasi', 'Belum Terverifikasi', 'Ditolak']).withMessage('Status verifikasi harus Terverifikasi, Belum Terverifikasi, atau Ditolak')
];

// Validasi untuk update data dokter
exports.updateDoctorValidation = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('str_number')
    .optional()
    .trim()
    .matches(/^[0-9]{6,20}$/).withMessage('Nomor STR harus berupa angka dengan panjang 6-20 digit'),
    
  body('nik_number')
    .optional()
    .trim()
    .matches(/^[0-9]{16}$/).withMessage('Nomor NIK harus berupa 16 digit angka'),
    
  body('gender')
    .optional()
    .trim()
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin harus Laki-laki atau Perempuan'),
    
  body('birth_date')
    .optional()
    .trim()
    .isDate().withMessage('Format tanggal lahir tidak valid'),
    
  body('birth_place')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Tempat lahir harus antara 3-100 karakter'),
    
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Alamat tempat tinggal harus antara 10-500 karakter'),
    
  body('phone_number')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Format email tidak valid'),
    
  body('membership_status')
    .optional()
    .trim()
    .isIn(['Aktif', 'Tidak Aktif', 'Ditangguhkan']).withMessage('Status keanggotaan harus Aktif, Tidak Aktif, atau Ditangguhkan'),
    
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Spesialisasi harus antara 3-100 karakter'),
    
  body('education_institution')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Institusi pendidikan harus antara 3-200 karakter'),
    
  body('graduation_year')
    .optional()
    .trim()
    .matches(/^[0-9]{4}$/).withMessage('Tahun lulus harus berupa 4 digit angka')
    .custom(value => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        throw new Error(`Tahun lulus harus antara 1900 dan ${currentYear}`);
      }
      return true;
    }),
    
  body('practice_location')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Lokasi praktek harus antara 5-500 karakter'),
    
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Koordinat longitude harus antara -180 dan 180'),
    
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Koordinat latitude harus antara -90 dan 90'),
    
  body('verification_status')
    .optional()
    .isIn(['Terverifikasi', 'Belum Terverifikasi', 'Ditolak']).withMessage('Status verifikasi harus Terverifikasi, Belum Terverifikasi, atau Ditolak'),
    
  body('verification_notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Catatan verifikasi maksimal 500 karakter')
];

// Validasi untuk update status verifikasi
exports.updateVerificationStatusValidation = [
  body('verification_status')
    .notEmpty().withMessage('Status verifikasi wajib diisi')
    .isIn(['Terverifikasi', 'Belum Terverifikasi', 'Ditolak']).withMessage('Status verifikasi harus Terverifikasi, Belum Terverifikasi, atau Ditolak'),
    
  body('notes')
    .trim()
    .notEmpty().withMessage('Catatan verifikasi wajib diisi')
    .isLength({ min: 5, max: 500 }).withMessage('Catatan verifikasi harus antara 5-500 karakter')
];