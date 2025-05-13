const { body } = require('express-validator');

// Validasi untuk pembuatan agenda
exports.createAgendaValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul agenda wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Judul agenda harus antara 5-200 karakter'),
    
  body('description')
    .trim()
    .notEmpty().withMessage('Deskripsi agenda wajib diisi'),
    
  body('location')
    .trim()
    .notEmpty().withMessage('Lokasi agenda wajib diisi')
    .isLength({ min: 5, max: 255 }).withMessage('Lokasi agenda harus antara 5-255 karakter'),
    
  body('start_date')
    .trim()
    .notEmpty().withMessage('Tanggal mulai wajib diisi')
    .isISO8601().withMessage('Format tanggal mulai tidak valid'),
    
  body('end_date')
    .trim()
    .notEmpty().withMessage('Tanggal selesai wajib diisi')
    .isISO8601().withMessage('Format tanggal selesai tidak valid'),
    
  body('is_published')
    .optional()
    .isBoolean().withMessage('Status publikasi harus boolean')
];

// Validasi untuk update agenda
exports.updateAgendaValidation = [
  body('title')
    .trim()
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('Judul agenda harus antara 5-200 karakter'),
    
  body('description')
    .trim()
    .optional(),
    
  body('location')
    .trim()
    .optional()
    .isLength({ min: 5, max: 255 }).withMessage('Lokasi agenda harus antara 5-255 karakter'),
    
  body('start_date')
    .trim()
    .optional()
    .isISO8601().withMessage('Format tanggal mulai tidak valid'),
    
  body('end_date')
    .trim()
    .optional()
    .isISO8601().withMessage('Format tanggal selesai tidak valid'),
    
  body('is_published')
    .optional()
    .isBoolean().withMessage('Status publikasi harus boolean')
];

// Validasi untuk toggle status publikasi
exports.togglePublishValidation = [
  body('is_published')
    .notEmpty().withMessage('Status publikasi wajib diisi')
    .isBoolean().withMessage('Status publikasi harus boolean')
];