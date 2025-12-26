/**
 * MongoDB Atlas Database Configuration
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Modern Mongoose versions do not need useNewUrlParser or useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = { connectDB };