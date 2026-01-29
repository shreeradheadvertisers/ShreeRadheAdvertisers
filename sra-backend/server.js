/**
 * SRA Backend Server
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initScheduledJobs } = require('./src/services/cronService');

// --- Dynamic Environment Loading ---
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env';
require('dotenv').config({ path: path.join(__dirname, envFile) });

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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