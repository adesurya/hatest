const { body } = require('express-validator');

// Validasi untuk pembuatan fakultas kedokteran
exports.createFacultyValidation = [
  body('faculty_name')
    .trim()
    .notEmpty().withMessage('Nama fakultas wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama fakultas harus antara 3-100 karakter'),
    
  body('university_name')
    .trim()
    .notEmpty().withMessage('Nama universitas wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama universitas harus antara 3-100 karakter'),
    
  body('location')
    .trim()
    .notEmpty().withMessage('Lokasi wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Lokasi harus antara 3-100 karakter'),
    
  body('accreditation')
    .trim()
    .optional()
    .isLength({ max: 10 }).withMessage('Akreditasi maksimal 10 karakter'),
    
  body('internal_grade')
    .trim()
    .optional()
    .isLength({ max: 10 }).withMessage('Grade internal maksimal 10 karakter'),
    
  body('active_students')
    .optional()
    .isInt({ min: 0 }).withMessage('Jumlah mahasiswa aktif harus berupa angka positif'),
    
  body('established_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Tahun berdiri harus antara 1900 sampai ${new Date().getFullYear()}`),
    
  body('website')
    .trim()
    .optional()
    .isURL().withMessage('Website harus berupa URL yang valid')
    .isLength({ max: 255 }).withMessage('Website maksimal 255 karakter'),
    
  body('contact_info')
    .trim()
    .optional()
    .isLength({ max: 255 }).withMessage('Kontak terkait maksimal 255 karakter'),
    
  body('notes')
    .trim()
    .optional()
];

// Validasi untuk update fakultas kedokteran
exports.updateFacultyValidation = [
  body('faculty_name')
    .trim()
    .notEmpty().withMessage('Nama fakultas wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama fakultas harus antara 3-100 karakter'),
    
  body('university_name')
    .trim()
    .notEmpty().withMessage('Nama universitas wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama universitas harus antara 3-100 karakter'),
    
  body('location')
    .trim()
    .notEmpty().withMessage('Lokasi wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Lokasi harus antara 3-100 karakter'),
    
  body('accreditation')
    .trim()
    .optional()
    .isLength({ max: 10 }).withMessage('Akreditasi maksimal 10 karakter'),
    
  body('internal_grade')
    .trim()
    .optional()
    .isLength({ max: 10 }).withMessage('Grade internal maksimal 10 karakter'),
    
  body('active_students')
    .optional()
    .isInt({ min: 0 }).withMessage('Jumlah mahasiswa aktif harus berupa angka positif'),
    
  body('established_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Tahun berdiri harus antara 1900 sampai ${new Date().getFullYear()}`),
    
  body('website')
    .trim()
    .optional()
    .isURL().withMessage('Website harus berupa URL yang valid')
    .isLength({ max: 255 }).withMessage('Website maksimal 255 karakter'),
    
  body('contact_info')
    .trim()
    .optional()
    .isLength({ max: 255 }).withMessage('Kontak terkait maksimal 255 karakter'),
    
  body('notes')
    .trim()
    .optional()
];