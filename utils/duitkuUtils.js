// File: utils/duitkuUtils.js

const crypto = require('crypto');

/**
 * Utility functions for Duitku integration
 */

/**
 * Generate signature for Duitku payment request
 * Formula: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
const generatePaymentSignature = (merchantCode, merchantOrderId, paymentAmount, apiKey) => {
  const signatureString = merchantCode + merchantOrderId + paymentAmount + apiKey;
  return crypto.createHash('md5').update(signatureString).digest('hex');
};

/**
 * Verify signature from Duitku callback
 * Formula: MD5(merchantCode + amount + merchantOrderId + apiKey)
 */
const verifyCallbackSignature = (merchantCode, amount, merchantOrderId, apiKey, receivedSignature) => {
  const signatureString = merchantCode + amount + merchantOrderId + apiKey;
  const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
  return expectedSignature === receivedSignature;
};

/**
 * Generate signature for Duitku transaction status check
 * Formula: MD5(merchantCode + merchantOrderId + apiKey)
 */
const generateStatusSignature = (merchantCode, merchantOrderId, apiKey) => {
  const signatureString = merchantCode + merchantOrderId + apiKey;
  return crypto.createHash('md5').update(signatureString).digest('hex');
};

/**
 * Debugging tool to validate Duitku signatures
 * This function helps identify signature mismatch issues
 */
const validateSignatures = (params, apiKey) => {
  const { merchantCode, merchantOrderId, paymentAmount, amount, receivedSignature, type } = params;
  
  let expectedSignature;
  let signatureString;
  
  switch (type) {
    case 'payment':
      signatureString = merchantCode + merchantOrderId + paymentAmount + apiKey;
      expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
      return {
        type: 'Payment Request',
        signatureComponents: { merchantCode, merchantOrderId, paymentAmount },
        signatureString: merchantCode + merchantOrderId + paymentAmount + '***',
        expectedSignature,
        receivedSignature,
        isValid: expectedSignature === receivedSignature
      };
    
    case 'callback':
      signatureString = merchantCode + amount + merchantOrderId + apiKey;
      expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
      return {
        type: 'Callback Verification',
        signatureComponents: { merchantCode, amount, merchantOrderId },
        signatureString: merchantCode + amount + merchantOrderId + '***',
        expectedSignature,
        receivedSignature,
        isValid: expectedSignature === receivedSignature
      };
    
    case 'status':
      signatureString = merchantCode + merchantOrderId + apiKey;
      expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
      return {
        type: 'Status Check',
        signatureComponents: { merchantCode, merchantOrderId },
        signatureString: merchantCode + merchantOrderId + '***',
        expectedSignature,
        receivedSignature,
        isValid: expectedSignature === receivedSignature
      };
    
    default:
      return {
        error: 'Invalid signature type'
      };
  }
};

module.exports = {
  generatePaymentSignature,
  verifyCallbackSignature,
  generateStatusSignature,
  validateSignatures
};