const express = require('express');
const cors = require('cors');
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

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Healthcare App API',
    version: '1.0.0'
  });
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
  
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;