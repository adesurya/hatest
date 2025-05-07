const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Middleware untuk cek apakah user terautentikasi
exports.authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token tidak valid atau telah kedaluwarsa'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware untuk cek apakah user adalah admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Akses ditolak, Anda tidak memiliki hak akses admin'
    });
  }
  
  next();
};

// Middleware untuk cek apakah user adalah dokter
exports.isDokter = (req, res, next) => {
  if (!req.user || req.user.role !== 'Dokter') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Akses ditolak, Anda bukan dokter'
    });
  }
  
  next();
};

// Middleware untuk cek apakah user adalah dokterMuda
exports.isdokterMuda = (req, res, next) => {
  if (!req.user || req.user.role !== 'dokterMuda') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Akses ditolak, Anda bukan Dokter Muda'
    });
  }
  
  next();
};

// Fungsi untuk menghasilkan token JWT
exports.generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};