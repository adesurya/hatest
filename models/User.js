// File: models/User.js (Complete Fixed Version)

const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create a new user
  static async create(userData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        full_name, 
        email, 
        phone_number, 
        password, 
        birth_place, 
        birth_date, 
        category_id,
        institution,
        collegium_certificate_number,
        id_card_photo,
        profile_photo,
        membership_status
      } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate verification token
      const verificationToken = uuidv4();
      
      // Buat query dasar
      let query = `
        INSERT INTO users (
          full_name, 
          email, 
          phone_number, 
          password, 
          birth_place, 
          birth_date, 
          category_id,
          verification_token
      `;
      
      let values = [
        full_name,
        email,
        phone_number,
        hashedPassword,
        birth_place,
        birth_date,
        category_id,
        verificationToken
      ];
      
      // Tambahkan kolom opsional jika ada
      if (institution) {
        query += ', institution';
        values.push(institution);
      }
      
      if (collegium_certificate_number) {
        query += ', collegium_certificate_number';
        values.push(collegium_certificate_number);
      }
      
      if (id_card_photo) {
        query += ', id_card_photo';
        values.push(id_card_photo);
      }
      
      if (profile_photo) {
        query += ', profile_photo';
        values.push(profile_photo);
      }
      
      if (membership_status) {
        query += ', membership_status';
        values.push(membership_status);
      }
      
      // Tutup query
      query += ') VALUES (' + Array(values.length).fill('?').join(',') + ')';
      
      // Insert user ke database
      const [result] = await connection.query(query, values);
      
      await connection.commit();
      
      return {
        id: result.insertId,
        verificationToken
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Find user by id
  static async findById(id) {
    try {
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Verify a user's account
  static async verifyAccount(token) {
    try {
      const [result] = await pool.query(
        'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?',
        [token]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Create password reset token
  static async createResetToken(email) {
    try {
      // Find user by email
      const user = await this.findByEmail(email);
      if (!user) return null;
      
      // Generate reset token
      const resetToken = uuidv4();
      
      // Calculate expiry date (1 hour from now)
      const now = new Date();
      const expires = new Date(now.getTime() + parseInt(process.env.RESET_PASSWORD_EXPIRY) * 60 * 60 * 1000);
      
      // Save token to database
      await pool.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [resetToken, expires, user.id]
      );
      
      return {
        userId: user.id,
        resetToken,
        expires
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Verify reset token validity
  static async verifyResetToken(token) {
    try {
      const [users] = await pool.query(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Reset user password
  static async resetPassword(userId, password) {
    try {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user in database
      const [result] = await pool.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashedPassword, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Compare password for login
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Get user profile by id with role information
  static async getProfile(id) {
    try {
      const [users] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone_number, u.birth_place, u.birth_date,
        u.institution, u.collegium_certificate_number, u.id_card_photo, u.profile_photo,
        u.membership_status, u.is_admin, u.category_id, uc.name as role
        FROM users u
        JOIN user_categories uc ON u.category_id = uc.id
        WHERE u.id = ?`,
        [id]
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Update user profile
  static async updateProfile(userId, profileData, idCardPhoto = null, profilePhoto = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        full_name, 
        phone_number, 
        birth_place, 
        birth_date, 
        category_id,
        institution,
        collegium_certificate_number,
        membership_status
      } = profileData;
      
      // Siapkan data untuk diupdate
      let query = `
        UPDATE users 
        SET full_name = ?, 
            phone_number = ?, 
            birth_place = ?, 
            birth_date = ?
      `;
      
      let params = [full_name, phone_number, birth_place, birth_date];
      
      // Tambahkan parameter opsional jika disediakan
      if (category_id) {
        query += ', category_id = ?';
        params.push(category_id);
      }
      
      if (institution) {
        query += ', institution = ?';
        params.push(institution);
      }
      
      if (collegium_certificate_number) {
        query += ', collegium_certificate_number = ?';
        params.push(collegium_certificate_number);
      }
      
      if (membership_status) {
        query += ', membership_status = ?';
        params.push(membership_status);
      }
      
      // Tambahkan path foto ID jika ada
      if (idCardPhoto) {
        query += ', id_card_photo = ?';
        params.push(idCardPhoto);
      }
      
      // Tambahkan path foto profil jika ada
      if (profilePhoto) {
        query += ', profile_photo = ?';
        params.push(profilePhoto);
      }
      
      // Tambahkan kondisi WHERE dan parameter
      query += ' WHERE id = ?';
      params.push(userId);
      
      // Jalankan query
      const [result] = await connection.query(query, params);
      
      if (result.affectedRows === 0) {
        throw new Error('User tidak ditemukan');
      }
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Get all profiles (for admin)
  static async getAllProfiles(options = {}) {
    try {
      let query = `
        SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, 
        u.institution, u.membership_status, u.profile_photo,
        u.is_admin, uc.name as role, u.created_at
        FROM users u
        JOIN user_categories uc ON u.category_id = uc.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status keanggotaan jika disediakan
      if (options.membership_status) {
        query += ' WHERE u.membership_status = ?';
        params.push(options.membership_status);
      }
      
      // Filter berdasarkan kategori jika disediakan
      if (options.category_id) {
        query += options.membership_status ? ' AND u.category_id = ?' : ' WHERE u.category_id = ?';
        params.push(options.category_id);
      }
      
      // Filter pencarian
      if (options.search) {
        const searchClause = options.membership_status || options.category_id ? ' AND ' : ' WHERE ';
        query += `${searchClause}(u.full_name LIKE ? OR u.email LIKE ? OR u.institution LIKE ?)`;
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Sorting
      query += ' ORDER BY u.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [users] = await pool.query(query, params);
      
      return users;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total profiles (for pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM users u';
      const params = [];
      
      // Filter berdasarkan status keanggotaan jika disediakan
      if (options.membership_status) {
        query += ' WHERE u.membership_status = ?';
        params.push(options.membership_status);
      }
      
      // Filter berdasarkan kategori jika disediakan
      if (options.category_id) {
        query += options.membership_status ? ' AND u.category_id = ?' : ' WHERE u.category_id = ?';
        params.push(options.category_id);
      }
      
      // Filter pencarian
      if (options.search) {
        const searchClause = options.membership_status || options.category_id ? ' AND ' : ' WHERE ';
        query += `${searchClause}(u.full_name LIKE ? OR u.email LIKE ? OR u.institution LIKE ?)`;
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;