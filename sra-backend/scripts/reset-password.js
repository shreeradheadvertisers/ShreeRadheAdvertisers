/**
 * PROFESSIONAL PASSWORD RESET SCRIPT
 * Usage: node reset-password.js <username>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const AdminUser = require('../src/models/AdminUser'); // Ensure path is correct

// --- SECURITY HELPER: HIDDEN INPUT PROMPT ---
const askHidden = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Mute output to hide password characters
    process.stdout.write(query);
    rl.stdoutMuted = true;

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*"); // Show stars instead of characters
      else
        rl.output.write(stringToWrite);
    };

    rl.question('', (password) => {
      rl.close();
      process.stdout.write('\n'); // New line after enter
      resolve(password);
    });
  });
};

const resetPassword = async () => {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Usage: node reset-password.js <username>');
    process.exit(1);
  }

  const [username] = args;

  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 2. Find User
    const user = await AdminUser.findOne({ 
      $or: [
        { username: username.toLowerCase() }, 
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      console.error(`\n❌ User not found: "${username}"`);
      process.exit(1);
    }

    console.log(`\n👤 Resetting password for: ${user.name} (${user.email})`);

    // 3. Ask for Password (Twice)
    let password = '';
    let confirm = '';
    
    while (true) {
      password = await askHidden('🔑 Enter New Password: ');
      if (password.length < 8) {
        console.log('⚠️  Password must be at least 8 characters. Try again.\n');
        continue;
      }

      confirm = await askHidden('🔒 Confirm New Password: ');

      if (password === confirm) {
        break;
      }
      console.log('❌ Passwords do not match. Please try again.\n');
    }

    // 4. Save
    user.setPassword(password);
    await user.save();

    console.log(`\n✅ SUCCESS! Password updated successfully.`);
    console.log(`🚀 You can now login to the admin dashboard.`);

  } catch (error) {
    console.error('❌ System Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetPassword();