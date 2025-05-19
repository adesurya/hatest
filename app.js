const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const passport = require('./config/passport');
const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const examRoutes = require('./routes/examRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const dokterMudaRoutes = require('./routes/dokterMudaRoutes');
const medicalFacultyRoutes = require('./routes/medicalFacultyRoutes');
const eventRoutes = require('./routes/eventRoutes');
const kurikulumRoutes = require('./routes/kurikulumRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const aboutProfileRoutes = require('./routes/aboutProfileRoutes');
const articleRoutes = require('./routes/articleRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const visionMissionRoutes = require('./routes/visionMissionRoutes');
const contactRoutes = require('./routes/contactRoutes');
const organizationHistoryRoutes = require('./routes/organizationHistoryRoutes');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'uploads')));

// Test database and email configurations
const testConfigurations = async () => {
  await testConnection();
  await verifyEmailConfig();
};

testConfigurations();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dokter-muda', dokterMudaRoutes);
app.use('/api/medical-faculties', medicalFacultyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/kurikulum', kurikulumRoutes); 
app.use('/api/sliders', sliderRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/about-profiles', aboutProfileRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/vision-mission', visionMissionRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/organization-history', organizationHistoryRoutes);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create directory for payment status page assets if it doesn't exist
const paymentAssetsDir = path.join(__dirname, 'uploads', 'payment-status');
if (!fs.existsSync(paymentAssetsDir)) {
  fs.mkdirSync(paymentAssetsDir, { recursive: true });
}

// Support for serving HTML templates for payment status pages
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Healthcare App API',
    version: '1.0.0'
  });
});

// Route to handle direct access to payment status page
app.get('/payment/status/:merchantOrderId', (req, res) => {
  res.redirect(`/api/payments/status/${req.params.merchantOrderId}`);
});

// 404 - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint tidak ditemukan'
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Check if request wants HTML response
  const acceptsHtml = req.accepts('html');
  
  if (acceptsHtml && req.path.includes('/api/payments/status')) {
    // Return HTML error page for payment status routes
    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terjadi Kesalahan - Healthcare App</title>
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-icon">✕</div>
        <h1>Terjadi Kesalahan</h1>
        <p>Maaf, terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi atau hubungi admin.</p>
        <a href="${process.env.FRONTEND_URL}" class="button">Kembali ke Dashboard</a>
      </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(html);
  }
  
  // Default JSON response for API routes
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;