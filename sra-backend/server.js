/**
 * SRA Backend Server
 */

const path = require('path');

// -----------------------------------------------------------
// 1. CRITICAL: LOAD ENVIRONMENT VARIABLES FIRST
// -----------------------------------------------------------
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env';
const envPath = path.join(__dirname, envFile);
require('dotenv').config({ path: envPath });

// Debug Log (To confirm it worked)
console.log('--- ENV CHECK ---');
console.log('Loading config from:', envFile);
// Confirm Logs DB variable is found (Critical for Dual-DB setup)
console.log('MONGODB_LOGS_URI found:', !!process.env.MONGODB_LOGS_URI ? 'YES' : 'NO');
console.log('-----------------');

// -----------------------------------------------------------
// 2. IMPORT LIBRARIES & LOCAL FILES
// -----------------------------------------------------------
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import local files AFTER loading env
const { initScheduledJobs } = require('./src/services/cronService'); 
const { connectDB } = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');

// Import generic routes
const routes = require('./src/routes'); 
const recycleBinRoutes = require('./src/routes/recycleBin'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Allowed Origins Optimization
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  frontendUrl,
  'http://localhost:8080',
  'https://shreeradheadvertisers.com',
  'https://www.shreeradheadvertisers.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('hostinger.com')) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// CONCURRENCY FIX: Lowered limit from 50mb to 5mb
// This prevents OOM (Out of Memory) crashes if multiple users send large JSONs.
// Image uploads are handled by 'multer' (multipart/form-data) and are NOT limited by this.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// --- LIGHTWEIGHT HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is awake',
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/auth', routes.authRoutes);
app.use('/api/analytics', routes.analyticsRoutes);
app.use('/api/media', routes.mediaRoutes);
app.use('/api/customers', routes.customerRoutes);
app.use('/api/bookings', routes.bookingRoutes);
app.use('/api/payments', routes.paymentsRoutes || routes.paymentRoutes);
app.use('/api/maintenance', routes.maintenanceRoutes);
app.use('/api/contact', routes.contactRoutes);
app.use('/api/compliance', routes.complianceRoutes);
app.use('/api/media/upload', routes.uploadRoutes);
app.use('/api/users', routes.userRoutes);

app.use('/api/recycle-bin', recycleBinRoutes);

// Root Route
app.get('/', (req, res) => res.send('SRA Backend API is running. Use /api/health for status.'));

initScheduledJobs();

// Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();