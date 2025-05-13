const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class Doctor {
  // Dapatkan semua data dokter
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT d.*, u.full_name as created_by_name
        FROM doctors d
        JOIN users u ON d.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status verifikasi
      if (options.verificationStatus) {
        query += ' WHERE d.verification_status = ?';
        params.push(options.verificationStatus);
      }
      
      // Filter berdasarkan specialization
      if (options.specialization) {
        query += options.verificationStatus ? ' AND d.specialization = ?' : ' WHERE d.specialization = ?';
        params.push(options.specialization);
      }
      
      // Filter pencarian
      if (options.search) {
        const searchQuery = options.verificationStatus || options.specialization ? ' AND' : ' WHERE';
        query += `${searchQuery} (d.full_name LIKE ? OR d.str_number LIKE ? OR d.email LIKE ?)`;
        const searchParam = `%${options.search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      // Sorting
      query += ' ORDER BY d.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [doctors] = await pool.query(query, params);
      
      return doctors;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total dokter (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM doctors d';
      const params = [];
      
      // Filter berdasarkan status verifikasi
      if (options.verificationStatus) {
        query += ' WHERE d.verification_status = ?';
        params.push(options.verificationStatus);
      }
      
      // Filter berdasarkan specialization
      if (options.specialization) {
        query += options.verificationStatus ? ' AND d.specialization = ?' : ' WHERE d.specialization = ?';
        params.push(options.specialization);
      }
      
      // Filter pencarian
      if (options.search) {
        const searchQuery = options.verificationStatus || options.specialization ? ' AND' : ' WHERE';
        query += `${searchQuery} (d.full_name LIKE ? OR d.str_number LIKE ? OR d.email LIKE ?)`;
        const searchParam = `%${options.search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan dokter berdasarkan ID
  static async getById(id) {
    try {
      const [doctors] = await pool.query(
        `SELECT d.*, u.full_name as created_by_name
        FROM doctors d
        JOIN users u ON d.created_by = u.id
        WHERE d.id = ?`,
        [id]
      );
      
      return doctors.length > 0 ? doctors[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Cek apakah STR Number sudah digunakan
  static async checkSTRExist(strNumber, excludeId = null) {
    try {
      let query = 'SELECT id FROM doctors WHERE str_number = ?';
      const params = [strNumber];
      
      // Jika excludeId diberikan (untuk update), exclude dokter dengan id tersebut
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const [result] = await pool.query(query, params);
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Cek apakah NIK Number sudah digunakan
  static async checkNIKExist(nikNumber, excludeId = null) {
    try {
      let query = 'SELECT id FROM doctors WHERE nik_number = ?';
      const params = [nikNumber];
      
      // Jika excludeId diberikan (untuk update), exclude dokter dengan id tersebut
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const [result] = await pool.query(query, params);
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Cek apakah Email sudah digunakan
  static async checkEmailExist(email, excludeId = null) {
    try {
      let query = 'SELECT id FROM doctors WHERE email = ?';
      const params = [email];
      
      // Jika excludeId diberikan (untuk update), exclude dokter dengan id tersebut
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const [result] = await pool.query(query, params);
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat dokter baru
  static async create(data, profilePhoto, supportingDocument) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        full_name, 
        str_number, 
        nik_number, 
        gender, 
        birth_date, 
        birth_place, 
        address, 
        phone_number, 
        email, 
        membership_status, 
        specialization, 
        education_institution, 
        graduation_year, 
        practice_location, 
        longitude, 
        latitude, 
        verification_status, 
        created_by 
      } = data;
      
      let profile_photo_path = null;
      let supporting_document_path = null;
      
      // Jika ada file foto profil yang diupload
      if (profilePhoto) {
        const fileExt = path.extname(profilePhoto.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/doctors/profiles', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, profilePhoto.buffer);
        profile_photo_path = `/uploads/doctors/profiles/${fileName}`;
      }
      
      // Jika ada file dokumen pendukung yang diupload
      if (supportingDocument) {
        const fileExt = path.extname(supportingDocument.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/doctors/documents', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, supportingDocument.buffer);
        supporting_document_path = `/uploads/doctors/documents/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO doctors 
        (full_name, str_number, nik_number, gender, birth_date, birth_place, address, 
        phone_number, email, membership_status, specialization, education_institution, 
        graduation_year, practice_location, longitude, latitude, verification_status, 
        profile_photo, supporting_document, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, str_number, nik_number, gender, birth_date, birth_place, address, 
        phone_number, email, membership_status, specialization, education_institution, 
        graduation_year, practice_location, longitude, latitude, verification_status, 
        profile_photo_path, supporting_document_path, created_by]
      );
      
      const doctorId = result.insertId;
      
      // Jika status verifikasi diberikan, catat dalam riwayat verifikasi
      if (verification_status) {
        await connection.query(
          `INSERT INTO doctor_verification_history 
          (doctor_id, previous_status, new_status, notes, verified_by) 
          VALUES (?, ?, ?, ?, ?)`,
          [doctorId, null, verification_status, 'Pendaftaran awal', created_by]
        );
      }
      
      // Ambil data dokter yang baru dibuat
      const [doctors] = await connection.query(
        `SELECT d.*, u.full_name as created_by_name
        FROM doctors d
        JOIN users u ON d.created_by = u.id
        WHERE d.id = ?`,
        [doctorId]
      );
      
      await connection.commit();
      
      return doctors[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error, hapus file yang telah diupload (jika ada)
      if (data.profile_photo_path) {
        const photoPath = path.join(__dirname, '..', data.profile_photo_path);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
      
      if (data.supporting_document_path) {
        const documentPath = path.join(__dirname, '..', data.supporting_document_path);
        if (fs.existsSync(documentPath)) {
          fs.unlinkSync(documentPath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update dokter
  static async update(id, data, profilePhoto, supportingDocument) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data dokter yang akan diupdate
      const [doctors] = await connection.query('SELECT * FROM doctors WHERE id = ?', [id]);
      
      if (doctors.length === 0) {
        throw new Error('Dokter tidak ditemukan');
      }
      
      const doctor = doctors[0];
      
      const { 
        full_name, 
        str_number, 
        nik_number, 
        gender, 
        birth_date, 
        birth_place, 
        address, 
        phone_number, 
        email, 
        membership_status, 
        specialization, 
        education_institution, 
        graduation_year, 
        practice_location, 
        longitude, 
        latitude, 
        verification_status
      } = data;
      
      let profile_photo_path = doctor.profile_photo;
      let supporting_document_path = doctor.supporting_document;
      
      // Jika ada file foto profil baru yang diupload
      if (profilePhoto) {
        // Hapus file lama jika ada
        if (doctor.profile_photo) {
          const oldFilePath = path.join(__dirname, '..', doctor.profile_photo);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(profilePhoto.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/doctors/profiles', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, profilePhoto.buffer);
        profile_photo_path = `/uploads/doctors/profiles/${fileName}`;
      }
      
      // Jika ada file dokumen pendukung baru yang diupload
      if (supportingDocument) {
        // Hapus file lama jika ada
        if (doctor.supporting_document) {
          const oldFilePath = path.join(__dirname, '..', doctor.supporting_document);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(supportingDocument.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/doctors/documents', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, supportingDocument.buffer);
        supporting_document_path = `/uploads/doctors/documents/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE doctors 
        SET full_name = ?, str_number = ?, nik_number = ?, gender = ?, birth_date = ?, 
        birth_place = ?, address = ?, phone_number = ?, email = ?, membership_status = ?, 
        specialization = ?, education_institution = ?, graduation_year = ?, practice_location = ?, 
        longitude = ?, latitude = ?, verification_status = ?, profile_photo = ?, 
        supporting_document = ?
        WHERE id = ?`,
        [full_name, str_number, nik_number, gender, birth_date, birth_place, address,
        phone_number, email, membership_status, specialization, education_institution,
        graduation_year, practice_location, longitude, latitude, verification_status,
        profile_photo_path, supporting_document_path, id]
      );
      
      // Jika status verifikasi berubah, catat dalam riwayat verifikasi
      if (verification_status && verification_status !== doctor.verification_status) {
        await connection.query(
          `INSERT INTO doctor_verification_history 
          (doctor_id, previous_status, new_status, notes, verified_by) 
          VALUES (?, ?, ?, ?, ?)`,
          [id, doctor.verification_status, verification_status, data.verification_notes || 'Perubahan status verifikasi', data.updated_by]
        );
      }
      
      // Ambil data dokter yang telah diupdate
      const [updatedDoctors] = await connection.query(
        `SELECT d.*, u.full_name as created_by_name
        FROM doctors d
        JOIN users u ON d.created_by = u.id
        WHERE d.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedDoctors[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error dan ada file baru, hapus file tersebut
      if (profilePhoto && data.profile_photo_path) {
        const photoPath = path.join(__dirname, '..', data.profile_photo_path);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
      
      if (supportingDocument && data.supporting_document_path) {
        const documentPath = path.join(__dirname, '..', data.supporting_document_path);
        if (fs.existsSync(documentPath)) {
          fs.unlinkSync(documentPath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update status verifikasi dokter
  static async updateVerificationStatus(id, status, notes, verifiedBy) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data dokter saat ini
      const [doctors] = await connection.query('SELECT * FROM doctors WHERE id = ?', [id]);
      
      if (doctors.length === 0) {
        throw new Error('Dokter tidak ditemukan');
      }
      
      const doctor = doctors[0];
      
      // Update status verifikasi
      await connection.query(
        'UPDATE doctors SET verification_status = ? WHERE id = ?',
        [status, id]
      );
      
      // Catat dalam riwayat verifikasi
      await connection.query(
        `INSERT INTO doctor_verification_history 
        (doctor_id, previous_status, new_status, notes, verified_by) 
        VALUES (?, ?, ?, ?, ?)`,
        [id, doctor.verification_status, status, notes, verifiedBy]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Dapatkan riwayat verifikasi dokter
  static async getVerificationHistory(doctorId) {
    try {
      const [history] = await pool.query(
        `SELECT h.*, u.full_name as verified_by_name
        FROM doctor_verification_history h
        JOIN users u ON h.verified_by = u.id
        WHERE h.doctor_id = ?
        ORDER BY h.created_at DESC`,
        [doctorId]
      );
      
      return history;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus dokter
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data dokter yang akan dihapus
      const [doctors] = await connection.query('SELECT * FROM doctors WHERE id = ?', [id]);
      
      if (doctors.length === 0) {
        throw new Error('Dokter tidak ditemukan');
      }
      
      const doctor = doctors[0];
      
      // Hapus riwayat verifikasi
      await connection.query('DELETE FROM doctor_verification_history WHERE doctor_id = ?', [id]);
      
      // Hapus dokter dari database
      const [result] = await connection.query('DELETE FROM doctors WHERE id = ?', [id]);
      
      // Jika berhasil dihapus, hapus file yang terkait
      if (result.affectedRows > 0) {
        // Hapus foto profil jika ada
        if (doctor.profile_photo) {
          const photoPath = path.join(__dirname, '..', doctor.profile_photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }
        
        // Hapus dokumen pendukung jika ada
        if (doctor.supporting_document) {
          const documentPath = path.join(__dirname, '..', doctor.supporting_document);
          if (fs.existsSync(documentPath)) {
            fs.unlinkSync(documentPath);
          }
        }
      }
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Doctor;