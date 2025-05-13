const { body } = require('express-validator');

// Validasi untuk pembuatan sejarah organisasi
exports.createHistoryValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 3, max: 200 }).withMessage('Judul harus antara 3-200 karakter'),
    
  body('content')
    .trim()
    .notEmpty().withMessage('Konten wajib diisi'),
    
  body('year')
    .trim()
    .notEmpty().withMessage('Tahun wajib diisi')
    .isLength({ min: 4, max: 4 }).withMessage('Tahun harus 4 digit')
    .matches(/^[0-9]{4}$/).withMessage('Tahun harus berupa 4 digit angka'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];

// Validasi untuk update sejarah organisasi
exports.updateHistoryValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Judul harus antara 3-200 karakter'),
    
  body('content')
    .optional()
    .trim(),
    
  body('year')
    .optional()
    .trim()
    .isLength({ min: 4, max: 4 }).withMessage('Tahun harus 4 digit')
    .matches(/^[0-9]{4}$/).withMessage('Tahun harus berupa 4 digit angka'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];