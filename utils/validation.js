const { body, param } = require('express-validator');

// Validasi untuk registrasi
exports.registerValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor telepon tidak valid'),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/).withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'),
    
  body('birth_place')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi'),
    
  body('birth_date')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .isDate().withMessage('Format tanggal lahir tidak valid'),
    
  body('category')
    .trim()
    .notEmpty().withMessage('Kategori wajib diisi')
    .isIn(['Dokter', 'dokterMuda']).withMessage('Kategori harus Dokter atau Dokter Muda')
];

// Validasi untuk login
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
];

// Validasi untuk forgot password
exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
];

// Validasi untuk reset password
exports.resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Token reset password wajib diisi'),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/).withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus')
];

// Validasi untuk update profil
exports.updateProfileValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor telepon tidak valid'),
    
  body('birth_place')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi'),
    
  body('birth_date')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .isDate().withMessage('Format tanggal lahir tidak valid')
];

// Validasi untuk change password
exports.changePasswordValidation = [
  body('current_password')
    .trim()
    .notEmpty().withMessage('Password saat ini wajib diisi'),
    
  body('new_password')
    .trim()
    .notEmpty().withMessage('Password baru wajib diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/).withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus')
];