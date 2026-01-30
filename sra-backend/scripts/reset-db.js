/**
 * DANGER: This script deletes ALL bookings and resets everything.
 * Run with: node reset-db.js
 */
const path = require('path');
const envFile = process.env.NODE_ENV === 'development' ? '.env.local' : '.env';
require('dotenv').config({ path: path.join(__dirname, envFile) });

const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const Booking = require('../src/models/Booking');
const Media = require('../src/models/Media');
const Customer = require('../src/models/Customer');

async function resetDatabase() {
  try {
    console.log("⚠️  STARTING FULL DATA RESET...");
    await connectDB();

    // 1. Delete ALL Bookings
    console.log("1. Deleting all bookings...");
    const bookingResult = await Booking.deleteMany({});
    console.log(`   Deleted ${bookingResult.deletedCount} bookings.`);

    // 2. Reset All Media to 'Available'
    console.log("2. Resetting Media status...");
    const mediaResult = await Media.updateMany(
      {}, 
      { 
        $set: { 
          status: 'Available', 
          bookedDates: [] 
        } 
      }
    );
    console.log(`   Reset ${mediaResult.modifiedCount} media locations.`);

    // 3. Reset All Customer Stats
    console.log("3. Resetting Customer stats...");
    const customerResult = await Customer.updateMany(
      {}, 
      { 
        $set: { 
          totalBookings: 0, 
          totalSpent: 0 
        } 
      }
    );
    console.log(`   Reset stats for ${customerResult.modifiedCount} customers.`);

    console.log("\n✅ SYSTEM RESET COMPLETE. You can start fresh.");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

resetDatabase();