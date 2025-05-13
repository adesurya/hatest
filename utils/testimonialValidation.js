const { body } = require('express-validator');

// Validation for creating testimonial
exports.createTestimonialValidation = [
  body('organization_name')
    .trim()
    .notEmpty().withMessage('Nama organisasi wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama organisasi harus antara 2-100 karakter'),
    
  body('representative_name')
    .trim()
    .notEmpty().withMessage('Nama perwakilan wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama perwakilan harus antara 2-100 karakter'),
    
  body('representative_position')
    .trim()
    .notEmpty().withMessage('Jabatan perwakilan wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Jabatan perwakilan harus antara 2-100 karakter'),
    
  body('content')
    .trim()
    .notEmpty().withMessage('Konten testimonial wajib diisi')
    .isLength({ min: 10, max: 1000 }).withMessage('Konten testimonial harus antara 10-1000 karakter'),
    
  body('rating')
    .trim()
    .notEmpty().withMessage('Rating wajib diisi')
    .isInt({ min: 1, max: 5 }).withMessage('Rating harus berupa angka 1-5')
];

// Validation for updating testimonial
exports.updateTestimonialValidation = [
  body('organization_name')
    .trim()
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Nama organisasi harus antara 2-100 karakter'),
    
  body('representative_name')
    .trim()
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Nama perwakilan harus antara 2-100 karakter'),
    
  body('representative_position')
    .trim()
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Jabatan perwakilan harus antara 2-100 karakter'),
    
  body('content')
    .trim()
    .optional()
    .isLength({ min: 10, max: 1000 }).withMessage('Konten testimonial harus antara 10-1000 karakter'),
    
  body('rating')
    .trim()
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating harus berupa angka 1-5')
];