const { body } = require('express-validator');

// Validasi untuk pembuatan item vision atau mission
exports.createItemValidation = [
  body('type')
    .trim()
    .notEmpty().withMessage('Tipe wajib diisi')
    .isIn(['vision', 'mission']).withMessage('Tipe harus berupa vision atau mission'),
    
  body('content')
    .trim()
    .notEmpty().withMessage('Konten wajib diisi')
    .isLength({ min: 5 }).withMessage('Konten minimal 5 karakter'),
    
  body('order_number')
    .optional()
    .isInt({ min: 1 }).withMessage('Nomor urut harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];

// Validasi untuk update item vision atau mission
exports.updateItemValidation = [
  body('type')
    .optional()
    .trim()
    .isIn(['vision', 'mission']).withMessage('Tipe harus berupa vision atau mission'),
    
  body('content')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Konten minimal 5 karakter'),
    
  body('order_number')
    .optional()
    .isInt({ min: 1 }).withMessage('Nomor urut harus berupa angka positif'),
    
  body('is_active')
    .optional()
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];

// Validasi untuk toggle status aktif
exports.toggleActiveValidation = [
  body('is_active')
    .notEmpty().withMessage('Status aktif wajib diisi')
    .isBoolean().withMessage('Status aktif harus berupa boolean')
];