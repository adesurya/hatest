const { body } = require('express-validator');

// Validasi untuk pembuatan manfaat organisasi
exports.createBenefitValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul manfaat wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Judul manfaat harus antara 3-100 karakter'),
    
  body('description')
    .trim()
    .notEmpty().withMessage('Deskripsi manfaat wajib diisi'),
    
  body('icon')
    .trim()
    .optional()
    .isLength({ max: 100 }).withMessage('Icon maksimal 100 karakter'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean'),
    
  body('sort_order')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan harus berupa angka bulat positif atau 0')
];

// Validasi untuk update manfaat organisasi
exports.updateBenefitValidation = [
  body('title')
    .trim()
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Judul manfaat harus antara 3-100 karakter'),
    
  body('description')
    .trim()
    .optional(),
    
  body('icon')
    .trim()
    .optional()
    .isLength({ max: 100 }).withMessage('Icon maksimal 100 karakter'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean'),
    
  body('sort_order')
    .optional()
    .isInt({ min: 0 }).withMessage('Urutan harus berupa angka bulat positif atau 0')
];

// Validasi untuk update status aktif
exports.updateStatusValidation = [
  body('is_active')
    .notEmpty().withMessage('Status aktif wajib diisi')
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];

// Validasi untuk update urutan
exports.updateSortOrderValidation = [
  body('sort_order')
    .notEmpty().withMessage('Urutan wajib diisi')
    .isInt({ min: 0 }).withMessage('Urutan harus berupa angka bulat positif atau 0')
];