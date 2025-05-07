const { body } = require('express-validator');

// Validasi untuk pembuatan kategori ujian
exports.createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama kategori harus antara 3-100 karakter'),
    
  body('description')
    .trim()
    .optional()
    .isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter')
];

// Validasi untuk update kategori ujian
exports.updateCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama kategori harus antara 3-100 karakter'),
    
  body('description')
    .trim()
    .optional()
    .isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter')
];

// Validasi untuk pembuatan ujian
exports.createExamValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama ujian wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Nama ujian harus antara 5-200 karakter'),
    
  body('category_id')
    .trim()
    .notEmpty().withMessage('Kategori ujian wajib diisi')
    .isInt().withMessage('Kategori ujian harus berupa ID yang valid'),
    
  body('description')
    .trim()
    .notEmpty().withMessage('Deskripsi ujian wajib diisi'),
    
  body('requirements')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Persyaratan maksimal 1000 karakter'),
    
  body('location')
    .trim()
    .notEmpty().withMessage('Lokasi ujian wajib diisi')
    .isLength({ min: 5, max: 255 }).withMessage('Lokasi ujian harus antara 5-255 karakter'),
    
  body('exam_date')
    .trim()
    .notEmpty().withMessage('Tanggal ujian wajib diisi')
    .isISO8601().withMessage('Format tanggal ujian tidak valid'),
    
  body('fee')
    .trim()
    .notEmpty().withMessage('Biaya ujian wajib diisi')
    .isFloat({ min: 0 }).withMessage('Biaya ujian harus berupa angka positif')
];

// Validasi untuk update ujian
exports.updateExamValidation = [
  body('name')
    .trim()
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('Nama ujian harus antara 5-200 karakter'),
    
  body('category_id')
    .trim()
    .optional()
    .isInt().withMessage('Kategori ujian harus berupa ID yang valid'),
    
  body('description')
    .trim()
    .optional(),
    
  body('requirements')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Persyaratan maksimal 1000 karakter'),
    
  body('location')
    .trim()
    .optional()
    .isLength({ min: 5, max: 255 }).withMessage('Lokasi ujian harus antara 5-255 karakter'),
    
  body('exam_date')
    .trim()
    .optional()
    .isISO8601().withMessage('Format tanggal ujian tidak valid'),
    
  body('fee')
    .trim()
    .optional()
    .isFloat({ min: 0 }).withMessage('Biaya ujian harus berupa angka positif')
];

// Validasi untuk pembuatan transaksi
exports.createTransactionValidation = [
  body('exam_id')
    .trim()
    .notEmpty().withMessage('ID ujian wajib diisi')
    .isInt().withMessage('ID ujian harus berupa angka'),
    
  body('payment_method_code')
    .trim()
    .notEmpty().withMessage('Kode metode pembayaran wajib diisi')
    .isLength({ min: 2, max: 5 }).withMessage('Kode metode pembayaran harus antara 2-5 karakter')
    .matches(/^[A-Z0-9]+$/).withMessage('Kode metode pembayaran hanya boleh huruf kapital dan angka')
];

// Validasi untuk cek status transaksi
exports.checkTransactionValidation = [
  body('merchant_order_id')
    .trim()
    .notEmpty().withMessage('ID transaksi wajib diisi')
];