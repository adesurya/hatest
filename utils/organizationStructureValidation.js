const { body } = require('express-validator');

// Validasi untuk pembuatan struktur organisasi
exports.createStructureValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 3, max: 200 }).withMessage('Judul harus antara 3-200 karakter'),
    
  body('description')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Deskripsi maksimal 1000 karakter'),
    
  body('position')
    .trim()
    .optional()
    .isInt({ min: 0 }).withMessage('Posisi harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];

// Validasi untuk update struktur organisasi
exports.updateStructureValidation = [
  body('title')
    .trim()
    .optional()
    .isLength({ min: 3, max: 200 }).withMessage('Judul harus antara 3-200 karakter'),
    
  body('description')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Deskripsi maksimal 1000 karakter'),
    
  body('position')
    .trim()
    .optional()
    .isInt({ min: 0 }).withMessage('Posisi harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];