const { body } = require('express-validator');

// Validasi untuk pembuatan kurikulum
exports.createKurikulumValidation = [
  body('nama_fakultas')
    .trim()
    .notEmpty().withMessage('Nama fakultas wajib diisi')
    .isLength({ min: 3, max: 200 }).withMessage('Nama fakultas harus antara 3-200 karakter'),
    
  body('tahun_kurikulum')
    .trim()
    .notEmpty().withMessage('Tahun kurikulum wajib diisi')
    .isInt({ min: 1970, max: new Date().getFullYear() + 5 }).withMessage('Tahun kurikulum tidak valid'),
    
  body('deskripsi_kurikulum')
    .trim()
    .optional()
    .isLength({ max: 5000 }).withMessage('Deskripsi kurikulum maksimal 5000 karakter'),
    
  body('biaya_semester')
    .trim()
    .notEmpty().withMessage('Biaya semester wajib diisi')
    .isFloat({ min: 0 }).withMessage('Biaya semester harus berupa angka positif'),
    
  body('catatan')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Catatan maksimal 1000 karakter')
];

// Validasi untuk update kurikulum
exports.updateKurikulumValidation = [
  body('nama_fakultas')
    .trim()
    .optional()
    .isLength({ min: 3, max: 200 }).withMessage('Nama fakultas harus antara 3-200 karakter'),
    
  body('tahun_kurikulum')
    .trim()
    .optional()
    .isInt({ min: 1970, max: new Date().getFullYear() + 5 }).withMessage('Tahun kurikulum tidak valid'),
    
  body('deskripsi_kurikulum')
    .trim()
    .optional()
    .isLength({ max: 5000 }).withMessage('Deskripsi kurikulum maksimal 5000 karakter'),
    
  body('biaya_semester')
    .trim()
    .optional()
    .isFloat({ min: 0 }).withMessage('Biaya semester harus berupa angka positif'),
    
  body('catatan')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Catatan maksimal 1000 karakter')
];