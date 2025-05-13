const { body } = require('express-validator');

// Validasi untuk pembuatan slider
exports.createSliderValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul slider wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Judul slider harus antara 3-100 karakter'),
    
  body('description')
    .trim()
    .optional()
    .isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean'),
    
  body('order_number')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan harus berupa angka positif')
];

// Validasi untuk update slider
exports.updateSliderValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Judul slider harus antara 3-100 karakter'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean'),
    
  body('order_number')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan harus berupa angka positif')
];

// Validasi untuk toggle status aktif
exports.toggleActiveValidation = [
  body('is_active')
    .notEmpty().withMessage('Status aktif wajib diisi')
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];