/**
 * Analytics Routes - Fixed for Dual-Database Architecture
 */

const express = require('express');
const router = express.Router();
const { Media, Booking, Customer, Contact, ActivityLog } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Parser } = require('json2csv');
const { logActivity } = require('../services/logger');

// Dashboard Stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [
      totalMedia, 
      availableMedia, 
      bookedMedia, 
      comingSoon, 
      maintenance, 
      totalCustomers, 
      activeBookings,
      totalInquiries,
      newInquiries
    ] = await Promise.all([
      Media.countDocuments({ deleted: false }),
      Media.countDocuments({ deleted: false, status: 'Available' }),
      Media.countDocuments({ deleted: false, status: 'Booked' }),
      Media.countDocuments({ deleted: false, status: 'Coming Soon' }),
      Media.countDocuments({ deleted: false, status: 'Maintenance' }),
      Customer.countDocuments({ deleted: false }),
      Booking.countDocuments({ deleted: false, status: { $in: ['Active', 'Upcoming'] } }),
      Contact.countDocuments({}), 
      Contact.countDocuments({ status: 'New' }) 
    ]);

    const statesCount = await Media.distinct('state', { deleted: false });
    const districtsCount = await Media.distinct('district', { deleted: false });

    // FIX: Exclude 'Cancelled' bookings from ALL Revenue Calculations
    const revenueAgg = await Booking.aggregate([
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'Cancelled' } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          grossRevenue: { $sum: '$amount' }, 
          totalRevenue: { $sum: '$amountPaid' }, 
          pendingPayments: { $sum: { $subtract: ['$amount', '$amountPaid'] } } 
        } 
      }
    ]);

    const revenue = revenueAgg[0] || { grossRevenue: 0, totalRevenue: 0, pendingPayments: 0 };

    res.json({
      totalMedia,
      available: availableMedia,
      booked: bookedMedia,
      comingSoon,
      maintenance,
      statesCount: statesCount.length,
      districtsCount: districtsCount.length,
      totalCustomers,
      activeBookings,
      grossRevenue: revenue.grossRevenue,
      totalRevenue: revenue.totalRevenue,
      pendingPayments: revenue.pendingPayments,
      totalInquiries,
      newInquiries
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// City Revenue Loss - Vacant Sites by City
router.get('/city-loss', authMiddleware, async (req, res) => {
  try {
    const vacantByCity = await Media.aggregate([
      { $match: { deleted: false, status: 'Available' } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          totalLoss: { $sum: '$pricePerMonth' }
        }
      },
      { $sort: { totalLoss: -1 } },
      { $limit: 10 }
    ]);

    res.json(vacantByCity.map(item => ({
      name: item._id,
      count: item.count,
      loss: item.totalLoss
    })));
  } catch (error) {
    console.error('City loss analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch city loss data' });
  }
});

// Vacant Sites for Specific City
router.get('/vacant-sites/:city', authMiddleware, async (req, res) => {
  try {
    const { city } = req.params;
    
    const vacantSites = await Media.find({
      deleted: false,
      status: 'Available',
      city: city
    }).select('name type address pricePerMonth size lighting facing createdAt');

    const sitesWithVacancy = vacantSites.map(site => {
      const daysVacant = Math.floor((Date.now() - site.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: site._id,
        name: site.name,
        type: site.type,
        address: site.address,
        pricePerMonth: site.pricePerMonth,
        size: site.size,
        lighting: site.lighting,
        facing: site.facing,
        daysVacant: Math.max(15, daysVacant)
      };
    });

    res.json({
      city,
      count: sitesWithVacancy.length,
      monthlyLoss: sitesWithVacancy.reduce((sum, s) => sum + s.pricePerMonth, 0),
      sites: sitesWithVacancy.sort((a, b) => b.daysVacant - a.daysVacant)
    });
  } catch (error) {
    console.error('Vacant sites error:', error);
    res.status(500).json({ message: 'Failed to fetch vacant sites' });
  }
});

// Monthly Revenue Trend
router.get('/revenue-trend', authMiddleware, async (req, res) => {
  try {
    const trend = await Booking.aggregate([
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'Cancelled' }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amountPaid' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrend = trend.map(item => {
      const [, month] = item._id.split('-');
      return {
        month: months[parseInt(month) - 1],
        bookings: item.bookings,
        revenue: item.revenue
      };
    });

    res.json(formattedTrend);
  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue trend' });
  }
});

// State Revenue Distribution
router.get('/state-revenue', authMiddleware, async (req, res) => {
  try {
    const stateRevenue = await Booking.aggregate([
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'Cancelled' }
        } 
      },
      {
        $lookup: {
          from: 'media',
          localField: 'mediaId',
          foreignField: '_id',
          as: 'media'
        }
      },
      { $unwind: '$media' },
      {
        $group: {
          _id: '$media.state',
          revenue: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(stateRevenue.map(item => ({
      name: item._id,
      value: item.revenue,
      count: item.count
    })));
  } catch (error) {
    console.error('State revenue error:', error);
    res.status(500).json({ message: 'Failed to fetch state revenue' });
  }
});

// Occupancy Data
router.get('/occupancy', authMiddleware, async (req, res) => {
  try {
    const media = await Media.find({ deleted: false })
      .select('name occupancyRate totalDaysBooked')
      .sort({ occupancyRate: -1 })
      .limit(20);

    res.json(media.map(m => ({
      mediaId: m._id,
      mediaName: m.name,
      occupancyRate: m.occupancyRate,
      totalDaysBooked: m.totalDaysBooked
    })));
  } catch (error) {
    console.error('Occupancy error:', error);
    res.status(500).json({ message: 'Failed to fetch occupancy data' });
  }
});

// GET LOGS (Paginated & Filtered)
router.get('/audit-logs', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    // UPDATED: Added 'module' to destructuring
    const { user, action, module, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (user && user !== 'all') filter.user = user;
    if (action && action !== 'all') filter.action = action;
    // UPDATED: Added module filter logic
    if (module && module !== 'all') filter.module = module; 
    
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // FIXED: Removed .populate('user') since has now two DBs.
    // We now use the 'fullName' and 'role' snapshot fields stored in the log itself.
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await ActivityLog.countDocuments(filter);

    res.json({ data: logs, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Audit Logs Error:", error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// EXPORT LOGS (CSV)
router.get('/audit-logs/export', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    // UPDATED: Added 'module', 'action', and date params to export
    const { user, action, module, startDate, endDate } = req.query;
    
    const filter = {};
    if (user && user !== 'all') filter.user = user;
    if (action && action !== 'all') filter.action = action;
    if (module && module !== 'all') filter.module = module;
    
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // FIXED: Removed .populate(). Using snapshot fields.
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(1000);

    const fields = [
      { label: 'Time', value: (row) => new Date(row.createdAt).toLocaleString() },
      { label: 'User', value: (row) => row.fullName || row.username || 'System' }, // Use Snapshot
      { label: 'Role', value: (row) => row.role || 'System' }, // Use Snapshot
      { label: 'Action', value: 'action' },
      { label: 'Module', value: 'module' },
      { label: 'Description', value: 'description' },
      { label: 'IP', value: 'ipAddress' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs);

    // LOG ACTIVITY
    await logActivity(req, 'EXPORT', 'SYSTEM', `Exported audit logs`);

    res.header('Content-Type', 'text/csv');
    res.attachment(`audit_logs_${new Date().getTime()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Allow Frontend to report actions (like downloads)
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { action, module, description } = req.body;
    
    // Define allowed modules strictly from your DB Schema
    const allowedModules = ['AUTH', 'USER', 'BOOKING', 'MEDIA', 'PAYMENT', 'CUSTOMER', 'SYSTEM', 'REPORTS'];
    
    // If 'module' is invalid, force it to 'SYSTEM'
    const safeModule = allowedModules.includes(module) ? module : 'SYSTEM';

    await logActivity(
      req, 
      action || 'EXPORT', 
      safeModule,
      description || 'User performed an action'
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Manual logging failed:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;