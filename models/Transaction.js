const { pool } = require('../config/database');
const crypto = require('crypto');
const axios = require('axios');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class Transaction {
  // Buat transaksi baru
  static async create(data) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        user_id, 
        exam_id, 
        amount, 
        payment_method_id, 
        payment_code 
      } = data;
      
      // Cek apakah sudah ada pendaftaran
      const [existingRegistrations] = await connection.query(
        'SELECT id, transaction_id FROM exam_registrations WHERE user_id = ? AND exam_id = ?',
        [user_id, exam_id]
      );
      
      let registrationId;
      
      if (existingRegistrations.length > 0) {
        // User sudah terdaftar untuk ujian ini
        registrationId = existingRegistrations[0].id;
        
        // Cek apakah sudah ada transaksi
        if (existingRegistrations[0].transaction_id) {
          // Ambil transaksi yang sudah ada
          const [existingTransactions] = await connection.query(
            'SELECT * FROM transactions WHERE id = ?',
            [existingRegistrations[0].transaction_id]
          );
          
          if (existingTransactions.length > 0) {
            const existingTransaction = existingTransactions[0];
            
            // Jika transaksi sudah success, tidak perlu buat baru
            if (existingTransaction.status === 'success') {
              await connection.rollback();
              throw new Error('Anda sudah melakukan pembayaran untuk ujian ini');
            }
            
            // Jika transaksi masih pending dan belum expired, gunakan transaksi yang ada
            if (existingTransaction.status === 'pending' && new Date(existingTransaction.expiry_date) > new Date()) {
              await connection.rollback();
              return {
                id: existingTransaction.id,
                merchant_order_id: existingTransaction.merchant_order_id,
                user_id,
                exam_id,
                amount: existingTransaction.amount,
                payment_method_id: existingTransaction.payment_method_id,
                payment_code: existingTransaction.payment_code,
                expiry_date: existingTransaction.expiry_date,
                payment_url: existingTransaction.payment_url,
                va_number: existingTransaction.va_number,
                reference: existingTransaction.reference
              };
            }
          }
        }
      }
      
      // Generate merchant order ID
      const timestamp = new Date().getTime();
      const merchantOrderId = `ORDER-${user_id}-${exam_id}-${timestamp}`;
      
      // Set tanggal kedaluwarsa (10 menit)
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 10);
      
      // Insert transaksi ke database
      const [result] = await connection.query(
        `INSERT INTO transactions 
        (merchant_order_id, user_id, exam_id, amount, payment_method_id, payment_code, expiry_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [merchantOrderId, user_id, exam_id, amount, payment_method_id, payment_code, expiryDate]
      );
      
      const transactionId = result.insertId;
      
      // Jika belum ada pendaftaran, buat baru
      if (!registrationId) {
        const [registrationResult] = await connection.query(
          `INSERT INTO exam_registrations (user_id, exam_id, transaction_id, status) 
          VALUES (?, ?, ?, 'registered')`,
          [user_id, exam_id, transactionId]
        );
        
        registrationId = registrationResult.insertId;
      } else {
        // Update pendaftaran yang ada dengan transaction_id baru
        await connection.query(
          'UPDATE exam_registrations SET transaction_id = ? WHERE id = ?',
          [transactionId, registrationId]
        );
      }
      
      await connection.commit();
      
      return {
        id: transactionId,
        merchant_order_id: merchantOrderId,
        user_id,
        exam_id,
        amount,
        payment_method_id,
        payment_code,
        expiry_date: expiryDate,
        registration_id: registrationId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Dapatkan transaksi berdasarkan ID
  static async getById(id) {
    try {
      const [transactions] = await pool.query(
        `SELECT t.*, e.name as exam_name, u.email, u.full_name as user_name, pm.name as payment_method_name
        FROM transactions t
        JOIN exams e ON t.exam_id = e.id
        JOIN users u ON t.user_id = u.id
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.id = ?`,
        [id]
      );
      
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan transaksi berdasarkan merchant order ID
  static async getByMerchantOrderId(merchantOrderId) {
    try {
      const [transactions] = await pool.query(
        `SELECT t.*, e.name as exam_name, u.email, u.full_name as user_name, pm.name as payment_method_name
        FROM transactions t
        JOIN exams e ON t.exam_id = e.id
        JOIN users u ON t.user_id = u.id
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.merchant_order_id = ?`,
        [merchantOrderId]
      );
      
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan semua transaksi
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT t.*, e.name as exam_name, u.email, u.full_name as user_name, pm.name as payment_method_name
        FROM transactions t
        JOIN exams e ON t.exam_id = e.id
        JOIN users u ON t.user_id = u.id
        JOIN payment_methods pm ON t.payment_method_id = pm.id
      `;
      
      const params = [];
      
      // Filter berdasarkan status
      if (options.status) {
        query += ' WHERE t.status = ?';
        params.push(options.status);
      }
      
      // Filter berdasarkan user ID
      if (options.userId) {
        query += options.status ? ' AND t.user_id = ?' : ' WHERE t.user_id = ?';
        params.push(options.userId);
      }
      
      // Sorting
      query += ' ORDER BY t.created_at DESC';
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [transactions] = await pool.query(query, params);
      
      return transactions;
    } catch (error) {
      throw error;
    }
  }
  
  // Hitung total transaksi (untuk pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM transactions t';
      const params = [];
      
      // Filter berdasarkan status
      if (options.status) {
        query += ' WHERE t.status = ?';
        params.push(options.status);
      }
      
      // Filter berdasarkan user ID
      if (options.userId) {
        query += options.status ? ' AND t.user_id = ?' : ' WHERE t.user_id = ?';
        params.push(options.userId);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Kirim permintaan transaksi ke Duitku
static async requestPayment(transaction, user, exam) {
  try {
    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    const callbackUrl = `${process.env.BASE_URL}/api/payments/callback`;
    const returnUrl = `${process.env.FRONTEND_URL}/payment/status`;
    const expiryPeriod = 10; // 10 menit
    
    // Dapatkan timestamp saat ini dalam format yang dibutuhkan
    const datetime = new Date().toISOString().replace(/[-:\.]/g, '').slice(0, 14);
    
    // Generate signature dengan SHA256
    const signatureString = merchantCode + transaction.amount + datetime + apiKey;
    const signature = crypto.createHash('sha256')
      .update(signatureString)
      .digest('hex');
    
    // Prepare payload
    const payload = {
      merchantCode: merchantCode,
      paymentAmount: transaction.amount,
      paymentMethod: transaction.payment_code,
      merchantOrderId: transaction.merchant_order_id,
      productDetails: exam.name,
      email: user.email,
      customerVaName: user.full_name,
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      expiryPeriod: expiryPeriod,
      signature: signature,
      datetime: datetime
    };
    
    // Log payload untuk debugging
    console.log('Duitku request payload:', payload);
    
    // Kirim request ke Duitku
    const response = await axios.post(
      'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry',
      payload
    );
    
    console.log('Duitku response:', response.data);
    
    if (response.data.statusCode === '00') {
      // Update transaksi dengan data dari Duitku
      await pool.query(
        `UPDATE transactions 
        SET reference = ?, payment_url = ?, va_number = ?, qr_string = ?, signature = ? 
        WHERE id = ?`,
        [
          response.data.reference,
          response.data.paymentUrl,
          response.data.vaNumber || null,
          response.data.qrString || null,
          signature,
          transaction.id
        ]
      );
      
      return response.data;
    } else {
      throw new Error(`Gagal membuat transaksi: ${response.data.statusMessage}`);
    }
  } catch (error) {
    console.error('Error requesting payment:', error);
    throw error;
  }
}
  
// Update status transaksi dari callback Duitku
static async updateFromCallback(callbackData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      merchantOrderId, 
      resultCode, 
      reference, 
      signature,
      publisherOrderId,
      settlementDate,
      datetime
    } = callbackData;
    
    // Validasi signature
    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    const amount = callbackData.amount;
    
    // Gunakan SHA-256 untuk validasi signature
    const signatureString = merchantCode + amount + datetime + apiKey;
    const expectedSignature = crypto.createHash('sha256')
      .update(signatureString)
      .digest('hex');
    
    console.log('Validating callback signature:');
    console.log('Received signature:', signature);
    console.log('Expected signature:', expectedSignature);
    console.log('Signature string:', signatureString);
    
    if (signature !== expectedSignature) {
      throw new Error('Signature tidak valid');
    }
    
    // Ambil transaksi berdasarkan merchantOrderId
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE merchant_order_id = ?',
      [merchantOrderId]
    );
    
    if (transactions.length === 0) {
      throw new Error('Transaksi tidak ditemukan');
    }
    
    const transaction = transactions[0];
    
    // Tentukan status transaksi berdasarkan resultCode
    const status = resultCode === '00' ? 'success' : 'failed';
    
    // Update transaksi
    await connection.query(
      `UPDATE transactions 
      SET status = ?, reference = ?, callback_data = ?, 
      payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [status, reference, JSON.stringify(callbackData), transaction.id]
    );
    
    // Jika pembayaran berhasil, update status pendaftaran ujian
    if (status === 'success') {
      await connection.query(
        'UPDATE exam_registrations SET status = ? WHERE transaction_id = ?',
        ['paid', transaction.id]
      );
      
      // Generate QR code untuk bukti pembayaran
      const qrData = JSON.stringify({
        transaction_id: transaction.id,
        merchant_order_id: merchantOrderId,
        reference: reference,
        publisher_order_id: publisherOrderId,
        payment_date: new Date().toISOString(),
        amount: amount,
        status: 'PAID'
      });
      
      const qrImagePath = await this.generatePaymentQR(qrData, transaction.id);
      
      // Update QR image path di database
      await connection.query(
        'UPDATE transactions SET qr_image_path = ? WHERE id = ?',
        [qrImagePath, transaction.id]
      );
    }
    
    await connection.commit();
    
    return {
      success: true,
      status,
      transaction_id: transaction.id
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
  
  // Generate QR code untuk bukti pembayaran
  static async generatePaymentQR(data, transactionId) {
    try {
      // Pastikan direktori ada
      const qrDir = path.join(__dirname, '../uploads/qrcodes');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
      
      const qrFilePath = path.join(qrDir, `payment-${transactionId}.png`);
      const relativePath = `/uploads/qrcodes/payment-${transactionId}.png`;
      
      // Generate QR code
      await QRCode.toFile(qrFilePath, data, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      
      return relativePath;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }
  
// Cek status transaksi ke Duitku
static async checkStatus(merchantOrderId) {
  try {
    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    
    // Dapatkan timestamp saat ini dalam format yang dibutuhkan
    const datetime = new Date().toISOString().replace(/[-:\.]/g, '').slice(0, 14);
    
    // Generate signature dengan SHA-256
    const signatureString = merchantCode + merchantOrderId + datetime + apiKey;
    const signature = crypto.createHash('sha256')
      .update(signatureString)
      .digest('hex');
    
    // Prepare payload
    const payload = {
      merchantCode: merchantCode,
      merchantOrderId: merchantOrderId,
      signature: signature,
      datetime: datetime
    };
    
    console.log('Check transaction status payload:', payload);
    
    // Kirim request ke Duitku
    const response = await axios.post(
      'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus',
      payload
    );
    
    console.log('Check transaction status response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw error;
  }
}
  
  // Dapatkan transaksi user
  static async getUserTransactions(userId) {
    try {
      const [transactions] = await pool.query(
        `SELECT t.*, e.name as exam_name, pm.name as payment_method_name
        FROM transactions t
        JOIN exams e ON t.exam_id = e.id
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC`,
        [userId]
      );
      
      return transactions;
    } catch (error) {
      throw error;
    }
  }
  
  // Dapatkan detail transaksi untuk bukti pembayaran
  static async getPaymentDetail(id) {
    try {
      const [transactions] = await pool.query(
        `SELECT t.*, e.name as exam_name, e.exam_date, u.full_name as user_name, 
        u.email, pm.name as payment_method_name
        FROM transactions t
        JOIN exams e ON t.exam_id = e.id
        JOIN users u ON t.user_id = u.id
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.id = ? AND t.status = 'success'`,
        [id]
      );
      
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Transaction;