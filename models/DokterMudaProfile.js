const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class DokterMudaProfile {
  // Dapatkan semua profile dokter muda dengan filtering dan pagination
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT dmp.*, u.email as user_email
        FROM dokter_muda_profiles dmp
        JOIN users u ON dmp.user_id = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status verifikasi
      if (options.status_verifikasi) {
        query += ' WHERE dmp.status_verifikasi = ?';
        params.push(options.status_verifikasi);
      }
      
      // Filter berdasarkan status keanggotaan
      if (options.status_keanggotaan) {
        query += options.status_verifikasi ? ' AND dmp.status_keanggotaan = ?' : ' WHERE dmp.status_keanggotaan = ?';
        params.push(options.status_keanggotaan);
      }
      
      // Filter berdasarkan spesialisasi
      if (options.spesialisasi) {
        query += options.status_verifikasi || options.status_keanggotaan ? 
          ' AND dmp.spesialisasi LIKE ?' : ' WHERE dmp.spesialisasi LIKE ?';
        params.push(`%${options.spesialisasi}%`);
      }
      
      // Filter berdasarkan nama
      if (options.nama) {
        query += options.status_verifikasi || options.status_keanggotaan || options.spesialisasi ? 
          ' AND dmp.nama_lengkap LIKE ?' : ' WHERE dmp.nama_lengkap LIKE ?';
        params.push(`%${options.nama}%`);
      }
      
      // Sorting
      query += ' ORDER BY dmp.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [profiles] = await pool.query(query, params);
      
      return profiles;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total profiles (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM dokter_muda_profiles dmp';
      const params = [];
      
      // Filter berdasarkan status verifikasi
      if (options.status_verifikasi) {
        query += ' WHERE dmp.status_verifikasi = ?';
        params.push(options.status_verifikasi);
      }
      
      // Filter berdasarkan status keanggotaan
      if (options.status_keanggotaan) {
        query += options.status_verifikasi ? ' AND dmp.status_keanggotaan = ?' : ' WHERE dmp.status_keanggotaan = ?';
        params.push(options.status_keanggotaan);
      }
      
      // Filter berdasarkan spesialisasi
      if (options.spesialisasi) {
        query += options.status_verifikasi || options.status_keanggotaan ? 
          ' AND dmp.spesialisasi LIKE ?' : ' WHERE dmp.spesialisasi LIKE ?';
        params.push(`%${options.spesialisasi}%`);
      }
      
      // Filter berdasarkan nama
      if (options.nama) {
        query += options.status_verifikasi || options.status_keanggotaan || options.spesialisasi ? 
          ' AND dmp.nama_lengkap LIKE ?' : ' WHERE dmp.nama_lengkap LIKE ?';
        params.push(`%${options.nama}%`);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan profile berdasarkan ID
  static async getById(id) {
    try {
      const [profiles] = await pool.query(
        `SELECT dmp.*, u.email as user_email
        FROM dokter_muda_profiles dmp
        JOIN users u ON dmp.user_id = u.id
        WHERE dmp.id = ?`,
        [id]
      );
      
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan profile berdasarkan user ID
  static async getByUserId(userId) {
    try {
      const [profiles] = await pool.query(
        `SELECT dmp.*, u.email as user_email
        FROM dokter_muda_profiles dmp
        JOIN users u ON dmp.user_id = u.id
        WHERE dmp.user_id = ?`,
        [userId]
      );
      
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat profile baru
  static async create(data, fotoProfil = null, dokumenPendukung = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        user_id, 
        nama_lengkap, 
        nomor_str, 
        nomor_nik, 
        jenis_kelamin, 
        tanggal_lahir, 
        tempat_lahir, 
        alamat_tinggal, 
        no_hp, 
        email, 
        status_keanggotaan, 
        spesialisasi, 
        institusi_pendidikan, 
        tahun_lulus, 
        lokasi_praktek, 
        koordinat_longitude, 
        koordinat_latitude, 
        status_verifikasi 
      } = data;
      
      let foto_profil_path = null;
      let dokumen_pendukung_path = null;
      
      // Proses upload foto profil jika ada
      if (fotoProfil) {
        const fileExt = path.extname(fotoProfil.originalname);
        const fileName = `profile_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/profiles', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, fotoProfil.buffer);
        foto_profil_path = `/uploads/profiles/${fileName}`;
      }
      
      // Proses upload dokumen pendukung jika ada
      if (dokumenPendukung) {
        const fileExt = path.extname(dokumenPendukung.originalname);
        const fileName = `document_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/documents', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, dokumenPendukung.buffer);
        dokumen_pendukung_path = `/uploads/documents/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO dokter_muda_profiles 
        (user_id, nama_lengkap, nomor_str, nomor_nik, jenis_kelamin, tanggal_lahir, 
        tempat_lahir, alamat_tinggal, no_hp, email, status_keanggotaan, spesialisasi, 
        institusi_pendidikan, tahun_lulus, lokasi_praktek, koordinat_longitude, 
        koordinat_latitude, status_verifikasi, foto_profil, dokumen_pendukung) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, nama_lengkap, nomor_str, nomor_nik, jenis_kelamin, tanggal_lahir, 
          tempat_lahir, alamat_tinggal, no_hp, email, status_keanggotaan, spesialisasi, 
          institusi_pendidikan, tahun_lulus, lokasi_praktek, koordinat_longitude, 
          koordinat_latitude, status_verifikasi, foto_profil_path, dokumen_pendukung_path
        ]
      );
      
      const profileId = result.insertId;
      
      // Ambil data profile yang baru dibuat
      const [profiles] = await connection.query(
        `SELECT dmp.*, u.email as user_email
        FROM dokter_muda_profiles dmp
        JOIN users u ON dmp.user_id = u.id
        WHERE dmp.id = ?`,
        [profileId]
      );
      
      await connection.commit();
      
      return profiles[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error, hapus file yang telah diupload (jika ada)
      if (data.foto_profil_path) {
        const filePath = path.join(__dirname, '..', data.foto_profil_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      if (data.dokumen_pendukung_path) {
        const filePath = path.join(__dirname, '..', data.dokumen_pendukung_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update profile
  static async update(id, data, fotoProfil = null, dokumenPendukung = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data profile yang akan diupdate
      const [profiles] = await connection.query('SELECT * FROM dokter_muda_profiles WHERE id = ?', [id]);
      
      if (profiles.length === 0) {
        throw new Error('Profile dokter muda tidak ditemukan');
      }
      
      const profile = profiles[0];
      
      const { 
        nama_lengkap, 
        nomor_str, 
        nomor_nik, 
        jenis_kelamin, 
        tanggal_lahir, 
        tempat_lahir, 
        alamat_tinggal, 
        no_hp, 
        email, 
        status_keanggotaan, 
        spesialisasi, 
        institusi_pendidikan, 
        tahun_lulus, 
        lokasi_praktek, 
        koordinat_longitude, 
        koordinat_latitude, 
        status_verifikasi 
      } = data;
      
      let foto_profil_path = profile.foto_profil;
      let dokumen_pendukung_path = profile.dokumen_pendukung;
      
      // Proses upload foto profil baru jika ada
      if (fotoProfil) {
        // Hapus foto lama jika ada
        if (profile.foto_profil) {
          const oldFilePath = path.join(__dirname, '..', profile.foto_profil);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Upload foto baru
        const fileExt = path.extname(fotoProfil.originalname);
        const fileName = `profile_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/profiles', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, fotoProfil.buffer);
        foto_profil_path = `/uploads/profiles/${fileName}`;
      }
      
      // Proses upload dokumen pendukung baru jika ada
      if (dokumenPendukung) {
        // Hapus dokumen lama jika ada
        if (profile.dokumen_pendukung) {
          const oldFilePath = path.join(__dirname, '..', profile.dokumen_pendukung);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Upload dokumen baru
        const fileExt = path.extname(dokumenPendukung.originalname);
        const fileName = `document_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/documents', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, dokumenPendukung.buffer);
        dokumen_pendukung_path = `/uploads/documents/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE dokter_muda_profiles 
        SET nama_lengkap = ?, nomor_str = ?, nomor_nik = ?, jenis_kelamin = ?, 
        tanggal_lahir = ?, tempat_lahir = ?, alamat_tinggal = ?, no_hp = ?, 
        email = ?, status_keanggotaan = ?, spesialisasi = ?, institusi_pendidikan = ?, 
        tahun_lulus = ?, lokasi_praktek = ?, koordinat_longitude = ?, koordinat_latitude = ?, 
        status_verifikasi = ?, foto_profil = ?, dokumen_pendukung = ?
        WHERE id = ?`,
        [
          nama_lengkap, nomor_str, nomor_nik, jenis_kelamin, tanggal_lahir, tempat_lahir, 
          alamat_tinggal, no_hp, email, status_keanggotaan, spesialisasi, institusi_pendidikan, 
          tahun_lulus, lokasi_praktek, koordinat_longitude, koordinat_latitude, 
          status_verifikasi, foto_profil_path, dokumen_pendukung_path, id
        ]
      );
      
      // Ambil data profile yang telah diupdate
      const [updatedProfiles] = await connection.query(
        `SELECT dmp.*, u.email as user_email
        FROM dokter_muda_profiles dmp
        JOIN users u ON dmp.user_id = u.id
        WHERE dmp.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedProfiles[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error dan ada file baru, hapus file tersebut
      if (fotoProfil && data.foto_profil_path) {
        const filePath = path.join(__dirname, '..', data.foto_profil_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      if (dokumenPendukung && data.dokumen_pendukung_path) {
        const filePath = path.join(__dirname, '..', data.dokumen_pendukung_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update status verifikasi
  static async updateStatus(id, statusVerifikasi) {
    try {
      const [result] = await pool.query(
        'UPDATE dokter_muda_profiles SET status_verifikasi = ? WHERE id = ?',
        [statusVerifikasi, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Hapus profile
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data profile yang akan dihapus
      const [profiles] = await connection.query('SELECT * FROM dokter_muda_profiles WHERE id = ?', [id]);
      
      if (profiles.length === 0) {
        throw new Error('Profile dokter muda tidak ditemukan');
      }
      
      const profile = profiles[0];
      
      // Hapus profile dari database
      const [result] = await connection.query('DELETE FROM dokter_muda_profiles WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0) {
        // Hapus foto profil jika ada
        if (profile.foto_profil) {
          const fotoPath = path.join(__dirname, '..', profile.foto_profil);
          if (fs.existsSync(fotoPath)) {
            fs.unlinkSync(fotoPath);
          }
        }
        
        // Hapus dokumen pendukung jika ada
        if (profile.dokumen_pendukung) {
          const dokumenPath = path.join(__dirname, '..', profile.dokumen_pendukung);
          if (fs.existsSync(dokumenPath)) {
            fs.unlinkSync(dokumenPath);
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

module.exports = DokterMudaProfile;