const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

class KurikulumPendidikan {
  // Dapatkan semua kurikulum dengan pagination
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT kp.*, u.full_name as created_by_name
        FROM kurikulum_pendidikan kp
        JOIN users u ON kp.created_by = u.id
      `;
      
      const params = [];
      
      // Filter berdasarkan fakultas
      if (options.namaFakultas) {
        query += ' WHERE kp.nama_fakultas LIKE ?';
        params.push(`%${options.namaFakultas}%`);
      }
      
      // Filter berdasarkan tahun
      if (options.tahun) {
        query += options.namaFakultas ? ' AND kp.tahun_kurikulum = ?' : ' WHERE kp.tahun_kurikulum = ?';
        params.push(parseInt(options.tahun));
      }
      
      // Sorting (default: newest first)
      query += ' ORDER BY kp.tahun_kurikulum DESC, kp.nama_fakultas ASC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [kurikulums] = await pool.query(query, params);
      
      return kurikulums;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total kurikulum (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM kurikulum_pendidikan';
      const params = [];
      
      // Filter berdasarkan fakultas
      if (options.namaFakultas) {
        query += ' WHERE nama_fakultas LIKE ?';
        params.push(`%${options.namaFakultas}%`);
      }
      
      // Filter berdasarkan tahun
      if (options.tahun) {
        query += options.namaFakultas ? ' AND tahun_kurikulum = ?' : ' WHERE tahun_kurikulum = ?';
        params.push(parseInt(options.tahun));
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan kurikulum berdasarkan ID
  static async getById(id) {
    try {
      const [kurikulums] = await pool.query(
        `SELECT kp.*, u.full_name as created_by_name
        FROM kurikulum_pendidikan kp
        JOIN users u ON kp.created_by = u.id
        WHERE kp.id = ?`,
        [id]
      );
      
      return kurikulums.length > 0 ? kurikulums[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buat kurikulum baru
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        nama_fakultas, 
        tahun_kurikulum, 
        deskripsi_kurikulum, 
        biaya_semester, 
        catatan, 
        created_by 
      } = data;
      
      let file_kurikulum = null;
      
      // Jika ada file yang diupload
      if (file) {
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/kurikulum', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        file_kurikulum = `/uploads/kurikulum/${fileName}`;
      }
      
      // Insert ke database
      const [result] = await connection.query(
        `INSERT INTO kurikulum_pendidikan 
        (nama_fakultas, tahun_kurikulum, file_kurikulum, deskripsi_kurikulum, biaya_semester, catatan, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nama_fakultas, tahun_kurikulum, file_kurikulum, deskripsi_kurikulum, biaya_semester, catatan, created_by]
      );
      
      const kurikulumId = result.insertId;
      
      // Ambil data kurikulum yang baru dibuat
      const [kurikulums] = await connection.query(
        `SELECT kp.*, u.full_name as created_by_name
        FROM kurikulum_pendidikan kp
        JOIN users u ON kp.created_by = u.id
        WHERE kp.id = ?`,
        [kurikulumId]
      );
      
      await connection.commit();
      
      return kurikulums[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error, hapus file yang telah diupload (jika ada)
      if (data.file_kurikulum) {
        const filePath = path.join(__dirname, '..', data.file_kurikulum);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update kurikulum
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data kurikulum yang akan diupdate
      const [kurikulums] = await connection.query('SELECT * FROM kurikulum_pendidikan WHERE id = ?', [id]);
      
      if (kurikulums.length === 0) {
        throw new Error('Kurikulum tidak ditemukan');
      }
      
      const kurikulum = kurikulums[0];
      
      const { 
        nama_fakultas, 
        tahun_kurikulum, 
        deskripsi_kurikulum, 
        biaya_semester, 
        catatan 
      } = data;
      
      let file_kurikulum = kurikulum.file_kurikulum;
      
      // Jika ada file baru yang diupload
      if (file) {
        // Hapus file lama jika ada
        if (kurikulum.file_kurikulum) {
          const oldFilePath = path.join(__dirname, '..', kurikulum.file_kurikulum);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate nama file unik
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/kurikulum', fileName);
        
        // Pastikan direktori ada
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Simpan file
        fs.writeFileSync(uploadPath, file.buffer);
        file_kurikulum = `/uploads/kurikulum/${fileName}`;
      }
      
      // Update ke database
      await connection.query(
        `UPDATE kurikulum_pendidikan 
        SET nama_fakultas = ?, tahun_kurikulum = ?, file_kurikulum = ?, 
        deskripsi_kurikulum = ?, biaya_semester = ?, catatan = ? 
        WHERE id = ?`,
        [nama_fakultas, tahun_kurikulum, file_kurikulum, deskripsi_kurikulum, biaya_semester, catatan, id]
      );
      
      // Ambil data kurikulum yang telah diupdate
      const [updatedKurikulums] = await connection.query(
        `SELECT kp.*, u.full_name as created_by_name
        FROM kurikulum_pendidikan kp
        JOIN users u ON kp.created_by = u.id
        WHERE kp.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedKurikulums[0];
    } catch (error) {
      await connection.rollback();
      
      // Jika terjadi error dan ada file baru, hapus file tersebut
      if (file && data.file_kurikulum) {
        const filePath = path.join(__dirname, '..', data.file_kurikulum);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Hapus kurikulum
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Ambil data kurikulum yang akan dihapus
      const [kurikulums] = await connection.query('SELECT * FROM kurikulum_pendidikan WHERE id = ?', [id]);
      
      if (kurikulums.length === 0) {
        throw new Error('Kurikulum tidak ditemukan');
      }
      
      const kurikulum = kurikulums[0];
      
      // Hapus kurikulum dari database
      const [result] = await connection.query('DELETE FROM kurikulum_pendidikan WHERE id = ?', [id]);
      
      // Jika berhasil dihapus dan ada file, hapus file tersebut
      if (result.affectedRows > 0 && kurikulum.file_kurikulum) {
        const filePath = path.join(__dirname, '..', kurikulum.file_kurikulum);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
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

module.exports = KurikulumPendidikan;