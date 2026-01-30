/**
 * MongoDB Atlas Database Configuration - Dual Connection Support
 */
const mongoose = require('mongoose');

// 1. Create the Secondary Connection for Logs (The "Whale")
// This connection happens separately from the main one.
// Make sure MONGODB_LOGS_URI is defined in your .env file
const logsConnection = mongoose.createConnection(process.env.MONGODB_LOGS_URI);

logsConnection.on('connected', () => {
  console.log('✅ MongoDB (Logs) Connected');
});

logsConnection.on('error', (err) => {
  console.error('❌ MongoDB (Logs) Connection Error:', err);
});

// 2. Main Connection (The "Goldfish") - Stays the same
// This connects to your primary database for App Data (Media, Bookings, Users)
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB (Main) Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB (Main) connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Export both the main runner and the logs connection object
module.exports = { connectDB, logsConnection };