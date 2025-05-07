const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { pool } = require('./database');
require('dotenv').config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// Konfigurasi strategi JWT
passport.use(new JwtStrategy(options, async (jwtPayload, done) => {
  try {
    // Cek user berdasarkan id dari payload JWT
    const [users] = await pool.query(
      'SELECT id, email, full_name, is_admin, category_id FROM users WHERE id = ? AND is_verified = TRUE',
      [jwtPayload.id]
    );

    // Jika user ditemukan
    if (users.length > 0) {
      const user = users[0];
      
      // Ambil nama kategori
      const [categories] = await pool.query(
        'SELECT name FROM user_categories WHERE id = ?',
        [user.category_id]
      );
      
      user.role = categories[0].name;
      delete user.category_id;

      return done(null, user);
    }
    
    // Jika user tidak ditemukan
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;