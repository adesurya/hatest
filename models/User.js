const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create a new user
  static async create(userData) {
    const { full_name, email, phone_number, password, birth_place, birth_date, category_id } = userData;
    
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate verification token
      const verificationToken = uuidv4();
      
      // Insert user into database
      const [result] = await pool.query(
        `INSERT INTO users 
        (full_name, email, phone_number, password, birth_place, birth_date, category_id, verification_token) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, email, phone_number, hashedPassword, birth_place, birth_date, category_id, verificationToken]
      );
      
      return {
        id: result.insertId,
        verificationToken
      };
    } catch (error) {
      throw error;
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
        u.is_admin, uc.name as role
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
}

module.exports = User;