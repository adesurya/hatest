const { body } = require('express-validator');

// Validation for creating article category
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

// Validation for updating article category
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

// Validation for creating article
exports.createArticleValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Judul artikel wajib diisi')
    .isLength({ min: 5, max: 200 }).withMessage('Judul artikel harus antara 5-200 karakter'),
    
  body('content')
    .trim()
    .notEmpty().withMessage('Konten artikel wajib diisi'),
    
  body('excerpt')
    .trim()
    .optional()
    .isLength({ max: 500 }).withMessage('Kutipan maksimal 500 karakter'),
    
  body('category_id')
    .trim()
    .notEmpty().withMessage('Kategori artikel wajib diisi')
    .isInt().withMessage('Kategori artikel harus berupa ID yang valid'),
    
  body('status')
    .trim()
    .notEmpty().withMessage('Status artikel wajib diisi')
    .isIn(['draft', 'published', 'archived']).withMessage('Status harus draft, published, atau archived')
];

// Validation for updating article
exports.updateArticleValidation = [
  body('title')
    .trim()
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('Judul artikel harus antara 5-200 karakter'),
    
  body('content')
    .trim()
    .optional(),
    
  body('excerpt')
    .trim()
    .optional()
    .isLength({ max: 500 }).withMessage('Kutipan maksimal 500 karakter'),
    
  body('category_id')
    .trim()
    .optional()
    .isInt().withMessage('Kategori artikel harus berupa ID yang valid'),
    
  body('status')
    .trim()
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('Status harus draft, published, atau archived')
];