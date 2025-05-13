const { body } = require('express-validator');

// Validasi untuk pembuatan kontak
exports.createContactValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul kontak wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Judul kontak harus antara 3-100 karakter'),
    
  body('address')
    .trim()
    .notEmpty().withMessage('Alamat wajib diisi'),
    
  body('phone')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^(\+?[0-9]{1,4}[-\s]?)?[0-9]{6,14}$/).withMessage('Format nomor telepon tidak valid'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('website')
    .trim()
    .optional()
    .isURL().withMessage('Format website tidak valid'),
    
  body('open_hours')
    .trim()
    .optional()
];

// Validasi untuk update kontak
exports.updateContactValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul kontak wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Judul kontak harus antara 3-100 karakter'),
    
  body('address')
    .trim()
    .notEmpty().withMessage('Alamat wajib diisi'),
    
  body('phone')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^(\+?[0-9]{1,4}[-\s]?)?[0-9]{6,14}$/).withMessage('Format nomor telepon tidak valid'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
    
  body('website')
    .trim()
    .optional()
    .isURL().withMessage('Format website tidak valid'),
    
  body('open_hours')
    .trim()
    .optional()
];