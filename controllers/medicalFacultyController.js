const MedicalFaculty = require('../models/MedicalFaculty');
const { validationResult } = require('express-validator');

// Dapatkan semua fakultas kedokteran
exports.getAllFaculties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sort_by = req.query.sort_by || 'faculty_name';
    const sort_order = req.query.sort_order || 'ASC';
    
    const options = {
      page,
      limit,
      search,
      sort_by,
      sort_order
    };
    
    const faculties = await MedicalFaculty.getAll(options);
    const total = await MedicalFaculty.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      faculties,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all medical faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan fakultas kedokteran berdasarkan ID
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faculty = await MedicalFaculty.getById(id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Fakultas kedokteran tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      faculty
    });
  } catch (error) {
    console.error('Get medical faculty by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat fakultas kedokteran baru (admin only)
exports.createFaculty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { 
      faculty_name, 
      university_name, 
      location, 
      accreditation, 
      internal_grade, 
      active_students, 
      established_year, 
      website, 
      contact_info, 
      notes 
    } = req.body;
    
    // Cek duplikasi fakultas
    const faculties = await MedicalFaculty.getAll({
      search: faculty_name
    });
    
    const isDuplicate = faculties.some(faculty => 
      faculty.faculty_name === faculty_name && 
      faculty.university_name === university_name
    );
    
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'Fakultas kedokteran dengan nama dan universitas yang sama sudah ada'
      });
    }
    
    // Persiapkan data fakultas
    const facultyData = {
      faculty_name,
      university_name,
      location,
      accreditation,
      internal_grade,
      active_students,
      established_year,
      website,
      contact_info,
      notes
    };
    
    // Buat fakultas baru
    const newFaculty = await MedicalFaculty.create(facultyData);
    
    res.status(201).json({
      success: true,
      message: 'Fakultas kedokteran berhasil dibuat',
      faculty: newFaculty
    });
  } catch (error) {
    console.error('Create medical faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update fakultas kedokteran (admin only)
exports.updateFaculty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { 
      faculty_name, 
      university_name, 
      location, 
      accreditation, 
      internal_grade, 
      active_students, 
      established_year, 
      website, 
      contact_info, 
      notes 
    } = req.body;
    
    // Cek apakah fakultas ada
    const faculty = await MedicalFaculty.getById(id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Fakultas kedokteran tidak ditemukan'
      });
    }
    
    // Cek duplikasi fakultas jika nama atau universitas berubah
    if (faculty_name !== faculty.faculty_name || university_name !== faculty.university_name) {
      const faculties = await MedicalFaculty.getAll({
        search: faculty_name
      });
      
      const isDuplicate = faculties.some(f => 
        f.id !== parseInt(id) && 
        f.faculty_name === faculty_name && 
        f.university_name === university_name
      );
      
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: 'Fakultas kedokteran dengan nama dan universitas yang sama sudah ada'
        });
      }
    }
    
    // Persiapkan data update
    const facultyData = {
      faculty_name,
      university_name,
      location,
      accreditation,
      internal_grade,
      active_students,
      established_year,
      website,
      contact_info,
      notes
    };
    
    // Update fakultas
    const success = await MedicalFaculty.update(id, facultyData);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengupdate fakultas kedokteran'
      });
    }
    
    // Ambil data yang telah diupdate
    const updatedFaculty = await MedicalFaculty.getById(id);
    
    res.json({
      success: true,
      message: 'Fakultas kedokteran berhasil diupdate',
      faculty: updatedFaculty
    });
  } catch (error) {
    console.error('Update medical faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Hapus fakultas kedokteran (admin only)
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah fakultas ada
    const faculty = await MedicalFaculty.getById(id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Fakultas kedokteran tidak ditemukan'
      });
    }
    
    const success = await MedicalFaculty.delete(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus fakultas kedokteran'
      });
    }
    
    res.json({
      success: true,
      message: 'Fakultas kedokteran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete medical faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};