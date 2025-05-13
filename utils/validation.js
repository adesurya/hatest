// File: utils/validation.js (Complete validation for User Profile)

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
    .notEmpty().withMessage('Jenis keanggotaan wajib diisi')
    .isIn(['Dokter', 'dokterMuda']).withMessage('Jenis keanggotaan harus Dokter atau Dokter Muda'),
  
  body('institution')
    .trim()
    .notEmpty().withMessage('Institusi asal wajib diisi')
    .isLength({ max: 255 }).withMessage('Institusi asal maksimal 255 karakter'),
  
  body('collegium_certificate_number')
    .trim()
    .notEmpty().withMessage('Nomor SK Kolegium wajib diisi')
    .isLength({ max: 100 }).withMessage('Nomor SK Kolegium maksimal 100 karakter')
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
    .isDate().withMessage('Format tanggal lahir tidak valid'),
  
  body('category_id')
    .optional()
    .isInt().withMessage('Kategori keanggotaan harus berupa angka'),
  
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Institusi asal maksimal 255 karakter'),
  
  body('collegium_certificate_number')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Nomor SK Kolegium maksimal 100 karakter'),
  
  body('membership_status')
    .optional()
    .trim()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Status keanggotaan harus active, inactive, atau suspended')
];

// Validasi untuk admin update profil (tambahan)
exports.adminUpdateProfileValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama lengkap harus antara 3-100 karakter'),
    
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor telepon tidak valid'),
    
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Format email tidak valid'),
    
  body('birth_place')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi'),
    
  body('birth_date')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .isDate().withMessage('Format tanggal lahir tidak valid'),
  
  body('category_id')
    .trim()
    .notEmpty().withMessage('Jenis keanggotaan wajib diisi')
    .isInt().withMessage('Jenis keanggotaan harus berupa angka'),
  
  body('institution')
    .trim()
    .notEmpty().withMessage('Institusi asal wajib diisi')
    .isLength({ max: 255 }).withMessage('Institusi asal maksimal 255 karakter'),
  
  body('collegium_certificate_number')
    .trim()
    .notEmpty().withMessage('Nomor SK Kolegium wajib diisi')
    .isLength({ max: 100 }).withMessage('Nomor SK Kolegium maksimal 100 karakter'),
  
  body('membership_status')
    .trim()
    .notEmpty().withMessage('Status keanggotaan wajib diisi')
    .isIn(['active', 'inactive', 'suspended']).withMessage('Status keanggotaan harus active, inactive, atau suspended')
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