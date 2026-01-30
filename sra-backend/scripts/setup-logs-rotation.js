/**
 * ONE-TIME SETUP SCRIPT
 * Converts the ActivityLogs collection to a "Capped Collection"
 * This ensures it acts like a circular buffer (Oldest deleted when full).
 */

const path = require('path');
// 1. Load Environment Variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env.production';
const envPath = path.join(__dirname, envFile);
require('dotenv').config({ path: envPath });

const mongoose = require('mongoose');

const setupRotation = async () => {
  try {
    console.log('⏳ Connecting to LOGS Database...');
    
    if (!process.env.MONGODB_LOGS_URI) {
      throw new Error('MONGODB_LOGS_URI is missing from .env file');
    }

    // Connect specifically to the Logs DB
    const conn = await mongoose.connect(process.env.MONGODB_LOGS_URI);
    console.log(`✅ Connected to: ${conn.connection.name}`);

    // 2. Define Limits
    // Free Tier = 512 MB. 
    // We set limit to ~350 MB to be super safe (leaving room for indexes/overhead).
    const SIZE_LIMIT_MB = 350;
    const SIZE_LIMIT_BYTES = SIZE_LIMIT_MB * 1024 * 1024;

    console.log(`🛠️  Converting 'activitylogs' to Capped Collection...`);
    console.log(`📊 Max Size: ${SIZE_LIMIT_MB} MB`);

    // 3. Run the Conversion Command
    await conn.connection.db.command({
      convertToCapped: 'activitylogs',
      size: SIZE_LIMIT_BYTES
    });

    console.log('🎉 SUCCESS! Collection is now Capped.');
    console.log('   - Logs will never exceed 350MB.');
    console.log('   - Oldest logs will be auto-deleted when full.');
    console.log('   - No manual maintenance required.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

setupRotation();