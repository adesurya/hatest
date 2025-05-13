const { body } = require('express-validator');

// Validation for creating about profile
exports.createProfileValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul profil wajib diisi')
    .isLength({ min: 3, max: 200 }).withMessage('Judul profil harus antara 3-200 karakter'),
    
  body('description')
    .trim()
    .notEmpty().withMessage('Deskripsi profil wajib diisi'),
    
  body('display_order')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan tampilan harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('Status aktif harus berupa boolean (true/false)')
];

// Validation for updating about profile
exports.updateProfileValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Judul profil harus antara 3-200 karakter'),
    
  body('description')
    .optional()
    .trim(),
    
  body('display_order')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan tampilan harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('Status aktif harus berupa boolean (true/false)')
];