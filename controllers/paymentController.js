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
    // Log data callback untuk debugging
    console.log('Callback data received:', req.body);
    
    // Ekstrak semua parameter callback
    const { 
      merchantCode, 
      amount, 
      merchantOrderId, 
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature,
      publisherOrderId,
      settlementDate,
      issuerCode,
      spUserHash
    } = req.body;
    
    // Verifikasi signature
    // Formula: MD5(merchantcode + amount + merchantOrderId + apiKey)
    const apiKey = process.env.DUITKU_API_KEY;
    const expectedSignature = crypto.createHash('md5')
      .update(merchantCode + amount + merchantOrderId + apiKey)
      .digest('hex');
    
    // Log signature verification details
    console.log('Callback signature verification:');
    console.log('Received signature:', signature);
    console.log('Expected signature:', expectedSignature);
    console.log('Signature components:', {
      merchantCode,
      amount,
      merchantOrderId,
      apiKey: '***' // Mask for security
    });
    
    // Jika signature tidak valid, tolak request
    if (signature !== expectedSignature) {
      console.error('Invalid signature:', {
        received: signature,
        expected: expectedSignature
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Cari transaksi berdasarkan merchantOrderId
    const transaction = await Transaction.getByMerchantOrderId(merchantOrderId);
    
    if (!transaction) {
      console.error('Transaction not found:', merchantOrderId);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Tentukan status transaksi berdasarkan resultCode
    // 00 - Success, 01 - Failed
    let status;
    if (resultCode === '00') {
      status = 'success';
    } else {
      status = 'failed';
    }
    
    // Proses callback dengan semua parameter
    const callbackData = {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature,
      publisherOrderId,
      settlementDate,
      issuerCode,
      spUserHash
    };
    
    // Update transaksi di database
    try {
      const result = await Transaction.updateFromCallback(callbackData);
      
      if (result.success) {
        // Return success (penting: Duitku membutuhkan respons 200 OK)
        return res.status(200).json({
          success: true
        });
      } else {
        throw new Error('Failed to process callback');
      }
    } catch (error) {
      console.error('Callback processing error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
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

// Return dari Duitku Payment Gateway
exports.returnPayment = async (req, res) => {
  try {
    // Dapatkan parameter dari query string
    const merchantOrderId = req.query.merchantOrderId || '';
    const reference = req.query.reference || '';
    const resultCode = req.query.resultCode || '';
    
    // Log data return untuk debugging
    console.log('Return data received:', {
      merchantOrderId,
      reference,
      resultCode
    });
    
    // Verifikasi parameter wajib
    if (!merchantOrderId) {
      console.error('Missing required parameter: merchantOrderId');
      return res.redirect('/api/payments/status/error?message=Missing+required+parameter');
    }
    
    // Redirect ke halaman status pembayaran dengan semua parameter
    // resultCode: 00 - Success, 01 - Pending, 02 - Canceled
    let status;
    switch (resultCode) {
      case '00':
        status = 'success';
        break;
      case '01':
        status = 'pending';
        break;
      case '02':
        status = 'canceled';
        break;
      default:
        status = 'unknown';
    }
    
    res.redirect(`/api/payments/status/${merchantOrderId}?reference=${reference}&resultCode=${resultCode}&status=${status}`);
  } catch (error) {
    console.error('Return payment error:', error);
    // Jika terjadi error, redirect ke halaman status dengan merchantOrderId kosong
    res.redirect('/api/payments/status/error');
  }
};

// Tampilkan halaman status pembayaran
exports.showPaymentStatus = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const reference = req.query.reference || '';
    const resultCode = req.query.resultCode || '';
    const statusFromReturn = req.query.status || '';
    
    // Cek apakah terjadi error
    if (merchantOrderId === 'error') {
      const errorMessage = req.query.message || 'Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi.';
      return renderPaymentStatusPage(res, {
        success: false,
        title: 'Pembayaran Gagal',
        message: errorMessage,
        status: 'failed'
      });
    }
    
    // Cek status transaksi di database
    const transaction = await Transaction.getByMerchantOrderId(merchantOrderId);
    
    if (!transaction) {
      return renderPaymentStatusPage(res, {
        success: false,
        title: 'Transaksi Tidak Ditemukan',
        message: 'Transaksi tidak ditemukan. Silakan periksa kembali atau hubungi admin.',
        status: 'failed'
      });
    }
    
    // Cek status transaksi di Duitku untuk mendapatkan status terbaru
    let statusResponse;
    try {
      statusResponse = await Transaction.checkStatus(merchantOrderId);
    } catch (error) {
      console.error('Error checking transaction status:', error);
      // Gunakan data dari database jika tidak bisa cek ke Duitku
      statusResponse = { 
        statusCode: transaction.status === 'success' ? '00' : 
                   (transaction.status === 'pending' ? '01' : '02'),
        statusMessage: ''
      };
    }
    
    let title, message, status;
    
    // Tentukan pesan dan status berdasarkan kode hasil
    if (resultCode === '00' || statusResponse.statusCode === '00' || transaction.status === 'success') {
      status = 'success';
      title = 'Pembayaran Berhasil';
      message = `Terima kasih, pembayaran Anda untuk ${transaction.exam_name} telah berhasil. Reference ID: ${reference || transaction.reference || statusResponse.reference || 'N/A'}`;
      
      // Jika status di Duitku success tapi di database belum, update database
      if (transaction.status !== 'success') {
        await pool.query(
          'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP, payment_date = CURRENT_TIMESTAMP WHERE id = ?',
          ['success', transaction.id]
        );
        
        // Update status pendaftaran ujian
        await pool.query(
          'UPDATE exam_registrations SET status = ? WHERE transaction_id = ?',
          ['paid', transaction.id]
        );
      }
    } else if (resultCode === '01' || statusResponse.statusCode === '01' || 
              (statusFromReturn === 'pending' && transaction.status === 'pending')) {
      status = 'pending';
      title = 'Pembayaran Tertunda';
      message = 'Pembayaran Anda sedang diproses. Silakan cek kembali nanti.';
    } else if (resultCode === '02' || statusFromReturn === 'canceled') {
      status = 'canceled';
      title = 'Pembayaran Dibatalkan';
      message = 'Anda telah membatalkan proses pembayaran. Silakan coba lagi atau pilih metode pembayaran lain.';
      
      // Update status transaksi menjadi canceled
      await pool.query(
        'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['canceled', transaction.id]
      );
    } else {
      status = 'failed';
      title = 'Pembayaran Gagal';
      message = `Pembayaran gagal: ${statusResponse.statusMessage || 'Terjadi kesalahan dalam proses pembayaran'}.`;
    }
    
    // Render halaman status pembayaran
    renderPaymentStatusPage(res, {
      success: status === 'success',
      title,
      message,
      status,
      transaction: {
        id: transaction.id,
        merchant_order_id: transaction.merchant_order_id,
        reference: reference || transaction.reference || statusResponse.reference || 'N/A',
        amount: transaction.amount,
        payment_method: transaction.payment_method_name,
        created_at: transaction.created_at,
        payment_date: transaction.payment_date || (status === 'success' ? new Date().toISOString() : null)
      },
      redirectUrl: process.env.FRONTEND_URL + "/dashboard/exams"
    });
  } catch (error) {
    console.error('Show payment status error:', error);
    renderPaymentStatusPage(res, {
      success: false,
      title: 'Terjadi Kesalahan',
      message: 'Terjadi kesalahan saat memeriksa status pembayaran. Silakan coba lagi nanti.',
      status: 'failed'
    });
  }
};

// Tambahkan controller function ini
exports.testDuitkuSignature = async (req, res) => {
  try {
    const { type, merchantCode, merchantOrderId, paymentAmount, amount, signature } = req.body;
    
    if (!type || !merchantCode || !merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    const apiKey = process.env.DUITKU_API_KEY;
    const duitkuUtils = require('../utils/duitkuUtils');
    
    const result = duitkuUtils.validateSignatures({
      type,
      merchantCode,
      merchantOrderId,
      paymentAmount,
      amount,
      receivedSignature: signature
    }, apiKey);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Test signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Helper function untuk render halaman status pembayaran
function renderPaymentStatusPage(res, data) {
  // Siapkan HTML untuk halaman status pembayaran
  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Healthcare App</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        padding: 30px;
        width: 90%;
        max-width: 500px;
        text-align: center;
      }
      .status-icon {
        font-size: 80px;
        margin-bottom: 20px;
      }
      .success {
        color: #28a745;
      }
      .pending {
        color: #ffc107;
      }
      .failed {
        color: #dc3545;
      }
      h1 {
        color: #333;
        margin-bottom: 15px;
        font-size: 24px;
      }
      p {
        color: #666;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .details {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        text-align: left;
        margin-bottom: 20px;
      }
      .details p {
        margin: 5px 0;
      }
      .buttons {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
      }
      .button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 12px 25px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: background-color 0.3s;
      }
      .button:hover {
        background-color: #0069d9;
      }
      .button.secondary {
        background-color: #6c757d;
      }
      .button.secondary:hover {
        background-color: #5a6268;
      }
      .receipt {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 100;
        justify-content: center;
        align-items: center;
        overflow: auto;
      }
      .receipt-content {
        background-color: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        position: relative;
      }
      .receipt-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 15px;
      }
      .receipt-logo {
        max-width: 150px;
        margin-bottom: 10px;
      }
      .receipt-title {
        font-size: 22px;
        color: #333;
        margin: 10px 0;
      }
      .receipt-close {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      .receipt-info {
        margin-bottom: 20px;
      }
      .receipt-row {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .receipt-label {
        font-weight: bold;
        width: 40%;
      }
      .receipt-value {
        width: 60%;
      }
      .receipt-footer {
        text-align: center;
        margin-top: 30px;
        color: #777;
        font-size: 14px;
      }
      .receipt-actions {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
      @media print {
        .receipt {
          position: absolute;
          background-color: white;
        }
        .receipt-content {
          box-shadow: none;
          width: 100%;
        }
        .receipt-close, .receipt-actions {
          display: none;
        }
        body * {
          visibility: hidden;
        }
        .receipt, .receipt * {
          visibility: visible;
        }
      }
      @media (max-width: 480px) {
        .container {
          padding: 20px;
          width: 95%;
        }
        h1 {
          font-size: 20px;
        }
        .status-icon {
          font-size: 60px;
        }
        .buttons {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="status-icon ${data.status || (data.success ? 'success' : 'failed')}">
        ${data.success ? '✓' : (data.status === 'pending' ? '⟳' : '✕')}
      </div>
      <h1>${data.title}</h1>
      <p>${data.message}</p>
      
      ${data.transaction ? `
      <div class="details">
        <p><strong>ID Transaksi:</strong> ${data.transaction.merchant_order_id}</p>
        <p><strong>Referensi:</strong> ${data.transaction.reference}</p>
        <p><strong>Jumlah:</strong> Rp ${new Intl.NumberFormat('id-ID').format(data.transaction.amount)}</p>
        <p><strong>Metode Pembayaran:</strong> ${data.transaction.payment_method}</p>
        ${data.transaction.payment_date && data.success ? `
        <p><strong>Tanggal Pembayaran:</strong> ${new Date(data.transaction.payment_date).toLocaleString('id-ID')}</p>
        ` : ''}
      </div>
      ` : ''}
      
      <div class="buttons">
        ${data.success ? `<button onclick="showReceipt()" class="button secondary">Lihat Bukti Pembayaran</button>` : ''}
        <a href="${data.redirectUrl || process.env.FRONTEND_URL}" class="button">Kembali ke Dashboard</a>
      </div>
    </div>
    
    ${data.success && data.transaction ? `
    <div id="receiptModal" class="receipt">
      <div class="receipt-content">
        <span class="receipt-close" onclick="hideReceipt()">&times;</span>
        
        <div class="receipt-header">
          <div class="receipt-title">BUKTI PEMBAYARAN</div>
          <div>Healthcare App</div>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-row">
            <div class="receipt-label">Status</div>
            <div class="receipt-value"><span style="color: #28a745; font-weight: bold;">LUNAS</span></div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Tanggal</div>
            <div class="receipt-value">${new Date(data.transaction.payment_date).toLocaleString('id-ID')}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">ID Transaksi</div>
            <div class="receipt-value">${data.transaction.merchant_order_id}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Referensi</div>
            <div class="receipt-value">${data.transaction.reference}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Metode Pembayaran</div>
            <div class="receipt-value">${data.transaction.payment_method}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Jumlah</div>
            <div class="receipt-value">Rp ${new Intl.NumberFormat('id-ID').format(data.transaction.amount)}</div>
          </div>
        </div>
        
        <div class="receipt-footer">
          <p>Terima kasih atas pembayaran Anda.</p>
          <p>Simpan bukti pembayaran ini sebagai referensi.</p>
        </div>
        
        <div class="receipt-actions">
          <button onclick="printReceipt()" class="button">Cetak Bukti Pembayaran</button>
        </div>
      </div>
    </div>
    ` : ''}
    
    <script>
      // Functions for receipt modal
      function showReceipt() {
        document.getElementById('receiptModal').style.display = 'flex';
      }
      
      function hideReceipt() {
        document.getElementById('receiptModal').style.display = 'none';
      }
      
      function printReceipt() {
        window.print();
      }
      
      // Auto redirect after 30 seconds
      ${!data.success ? `
      setTimeout(function() {
        window.location.href = "${data.redirectUrl || process.env.FRONTEND_URL}";
      }, 30000);
      ` : ''}
    </script>
  </body>
  </html>
  `;
  
  // Kirim HTML sebagai respons
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}