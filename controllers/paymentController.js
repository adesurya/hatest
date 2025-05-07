const Transaction = require('../models/Transaction');
const PaymentMethod = require('../models/PaymentMethod');
const ExamRegistration = require('../models/ExamRegistration');
const User = require('../models/User');
const Exam = require('../models/Exam');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../config/database');
require('dotenv').config();

// Dapatkan semua metode pembayaran aktif
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.getAllActive();
    
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Buat transaksi pembayaran
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { exam_id, payment_method_code } = req.body;
    const userId = req.user.id;
    
    // Cek apakah ujian ada
    const exam = await Exam.getById(exam_id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Ujian tidak ditemukan'
      });
    }
    
    // Cek apakah metode pembayaran valid
    const paymentMethod = await PaymentMethod.getByCode(payment_method_code);
    
    if (!paymentMethod || !paymentMethod.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid atau tidak aktif'
      });
    }
    
    // Cek apakah user sudah mendaftar ujian
    const isRegistered = await ExamRegistration.checkUserRegistered(userId, exam_id);
    
    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum mendaftar untuk ujian ini'
      });
    }
    
    // Buat transaksi
    const transactionData = {
      user_id: userId,
      exam_id: exam_id,
      amount: exam.fee,
      payment_method_id: paymentMethod.id,
      payment_code: payment_method_code
    };
    
    const transaction = await Transaction.create(transactionData);
    
    // Ambil data user
    const user = await User.findById(userId);
    
    // Kirim permintaan pembayaran ke Duitku
    const paymentResponse = await Transaction.requestPayment(transaction, user, exam);
    
    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      transaction: {
        id: transaction.id,
        merchant_order_id: transaction.merchant_order_id,
        amount: transaction.amount,
        payment_method: paymentMethod.name,
        payment_code: payment_method_code,
        reference: paymentResponse.reference,
        payment_url: paymentResponse.paymentUrl,
        va_number: paymentResponse.vaNumber || null,
        qr_string: paymentResponse.qrString || null,
        expiry_date: transaction.expiry_date
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Callback dari Duitku
exports.callbackPayment = async (req, res) => {
  try {
    // Verifikasi callback dengan membandingkan signature
    const callbackData = req.body;
    
    // Log data callback untuk debugging
    console.log('Callback data received:', callbackData);
    
    // Verifikasi signature
    try {
      const merchantCode = process.env.DUITKU_MERCHANT_CODE;
      const apiKey = process.env.DUITKU_API_KEY;
      const amount = callbackData.amount;
      const merchantOrderId = callbackData.merchantOrderId;
      
      const expectedSignature = crypto.createHash('md5')
        .update(merchantCode + merchantOrderId + amount + apiKey)
        .digest('hex');
      
      if (callbackData.signature !== expectedSignature) {
        console.error('Invalid signature:', {
          received: callbackData.signature,
          expected: expectedSignature
        });
        
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }
      
      // Proses callback
      const result = await Transaction.updateFromCallback(callbackData);
      
      if (result.success) {
        // Berhasil memproses callback
        res.json({
          success: true
        });
      } else {
        throw new Error('Gagal memproses callback');
      }
    } catch (callbackError) {
      console.error('Callback processing error:', callbackError);
      res.status(400).json({
        success: false,
        message: callbackError.message
      });
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Cek status transaksi
exports.checkTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { merchant_order_id } = req.body;
    
    // Cek status di database terlebih dahulu
    const transaction = await Transaction.getByMerchantOrderId(merchant_order_id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }
    
    // Cek apakah transaksi milik user yang sedang login, kecuali admin
    if (transaction.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke transaksi ini'
      });
    }
    
    // Cek ke Duitku untuk mendapatkan status terbaru
    const statusResponse = await Transaction.checkStatus(merchant_order_id);
    
    // Jika status di Duitku success (00) tapi di database belum, update database
    if (statusResponse.statusCode === '00' && transaction.status !== 'success') {
      // Update status transaksi
      await pool.query(
        'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['success', transaction.id]
      );
      
      // Update status pendaftaran ujian
      await pool.query(
        'UPDATE exam_registrations SET status = ? WHERE transaction_id = ?',
        ['paid', transaction.id]
      );
      
      // Reload data transaksi
      const [updatedTransactions] = await pool.query(
        'SELECT * FROM transactions WHERE id = ?',
        [transaction.id]
      );
      
      if (updatedTransactions.length > 0) {
        transaction.status = 'success';
        transaction.updated_at = updatedTransactions[0].updated_at;
      }
    }
    
    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        merchant_order_id: transaction.merchant_order_id,
        status: transaction.status,
        amount: transaction.amount,
        reference: transaction.reference,
        payment_method: transaction.payment_method_name,
        created_at: transaction.created_at,
        payment_date: transaction.payment_date,
        duitku_status: statusResponse
      }
    });
  } catch (error) {
    console.error('Check transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan transaksi user
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactions = await Transaction.getUserTransactions(userId);
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Dapatkan detail transaksi untuk bukti pembayaran
exports.getPaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const transaction = await Transaction.getPaymentDetail(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan atau belum sukses'
      });
    }
    
    // Cek apakah ini transaksi milik user yang sedang login
    if (transaction.user_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke transaksi ini'
      });
    }
    
    res.json({
      success: true,
      payment: {
        id: transaction.id,
        merchant_order_id: transaction.merchant_order_id,
        reference: transaction.reference,
        amount: transaction.amount,
        payment_method: transaction.payment_method_name,
        payment_date: transaction.payment_date,
        exam_name: transaction.exam_name,
        exam_date: transaction.exam_date,
        user_name: transaction.user_name,
        email: transaction.email,
        qr_image_path: transaction.qr_image_path,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('Get payment detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Dapatkan semua transaksi
exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const options = {
      page,
      limit,
      status
    };
    
    const transactions = await Transaction.getAll(options);
    const total = await Transaction.countTotal(options);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Generate QR Code pembayaran
exports.generatePaymentQR = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const transaction = await Transaction.getPaymentDetail(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan atau belum sukses'
      });
    }
    
    // Cek apakah ini transaksi milik user yang sedang login
    if (transaction.user_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke transaksi ini'
      });
    }
    
    // Cek apakah QR sudah dibuat
    if (!transaction.qr_image_path) {
      // Data untuk QR code
      const qrData = JSON.stringify({
        transaction_id: transaction.id,
        merchant_order_id: transaction.merchant_order_id,
        reference: transaction.reference,
        payment_date: transaction.payment_date,
        amount: transaction.amount,
        status: 'PAID'
      });
      
      // Generate QR code
      const qrImagePath = await Transaction.generatePaymentQR(qrData, transaction.id);
      
      if (!qrImagePath) {
        return res.status(500).json({
          success: false,
          message: 'Gagal membuat QR code'
        });
      }
      
      // Update QR image path di database
      await pool.query(
        'UPDATE transactions SET qr_image_path = ? WHERE id = ?',
        [qrImagePath, transaction.id]
      );
      
      transaction.qr_image_path = qrImagePath;
    }
    
    // Return QR image URL
    res.json({
      success: true,
      qr_url: `${process.env.BASE_URL}${transaction.qr_image_path}`
    });
  } catch (error) {
    console.error('Generate payment QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Admin: Update status transaksi manual
exports.updateTransactionStatus = async (req, res) => {
  try {
    // Hanya admin yang bisa mengupdate status transaksi secara manual
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melakukan tindakan ini'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validasi status
    if (!['pending', 'success', 'failed', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    // Cek apakah transaksi ada
    const transaction = await Transaction.getById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }
    
    // Update status transaksi
    await pool.query(
      'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    // Jika status success, update juga status pendaftaran ujian
    if (status === 'success') {
      await pool.query(
        'UPDATE exam_registrations SET status = ? WHERE transaction_id = ?',
        ['paid', id]
      );
      
      // Generate QR jika belum ada
      if (!transaction.qr_image_path) {
        const qrData = JSON.stringify({
          transaction_id: transaction.id,
          merchant_order_id: transaction.merchant_order_id,
          reference: transaction.reference || 'MANUAL-UPDATE',
          payment_date: new Date().toISOString(),
          amount: transaction.amount,
          status: 'PAID'
        });
        
        const qrImagePath = await Transaction.generatePaymentQR(qrData, transaction.id);
        
        if (qrImagePath) {
          await pool.query(
            'UPDATE transactions SET qr_image_path = ?, payment_date = CURRENT_TIMESTAMP WHERE id = ?',
            [qrImagePath, transaction.id]
          );
        }
      }
    } else if (status === 'failed' || status === 'expired') {
      // Jika status failed atau expired, update juga status pendaftaran ujian
      await pool.query(
        'UPDATE exam_registrations SET status = ? WHERE transaction_id = ?',
        ['cancelled', id]
      );
    }
    
    res.json({
      success: true,
      message: `Status transaksi berhasil diupdate menjadi ${status}`
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};