const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Tender, TaxRecord } = require('../models');

/**
 * Helper to clear the temp_uploads folder.
 * Since Render's disk is ephemeral and limited, clearing this on startup
 * is the most efficient way to prevent "Disk Full" errors without 
 * complex hourly polling.
 */
const clearTempFolder = () => {
  const tempPath = path.join(__dirname, '../temp_uploads');
  
  if (fs.existsSync(tempPath)) {
    try {
      const files = fs.readdirSync(tempPath);
      files.forEach(file => {
        // We keep .gitkeep so the directory structure remains in version control
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(tempPath, file));
        }
      });
      console.log('--- Startup: temp_uploads folder cleared ---');
    } catch (error) {
      console.error('--- Startup Cleanup Error:', error.message);
    }
  }
};

const initScheduledJobs = () => {
  // 1. RUN IMMEDIATELY ON STARTUP
  // This handles cleanup after Render restarts or redeploys
  clearTempFolder();

  // 2. SCHEDULED JOB: Nightly Recycle Bin Purge (Midnight)
  // Essential for MongoDB Atlas because DB storage is permanent.
  cron.schedule('0 0 * * *', async () => {
    console.log('--- Running Nightly Recycle Bin Purge ---');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // A. Purge Tenders older than 30 days
      const expiredTenders = await Tender.find({
        deleted: true,
        deletedAt: { $lte: thirtyDaysAgo }
      });

      if (expiredTenders.length > 0) {
        const tenderIds = expiredTenders.map(t => t._id);
        
        // Permanent Delete the Tenders
        await Tender.deleteMany({ _id: { $in: tenderIds } });
        
        // Cascading Purge: Delete all taxes associated with these purged tenders
        await TaxRecord.deleteMany({ tenderId: { $in: tenderIds } });
        
        console.log(`Purged ${expiredTenders.length} agreements and their associated taxes.`);
      }

      // B. Purge individual Tax Records 
      // (Those soft-deleted manually without deleting the whole tender)
      const purgedTaxes = await TaxRecord.deleteMany({
        deleted: true,
        deletedAt: { $lte: thirtyDaysAgo }
      });

      if (purgedTaxes.deletedCount > 0) {
        console.log(`Purged ${purgedTaxes.deletedCount} individual tax records.`);
      }
      
      console.log('--- Purge Complete ---');
      
    } catch (error) {
      console.error('Scheduled Purge Error:', error);
    }
  });
};

module.exports = { initScheduledJobs };