// routes/analytics.js
const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Public endpoint - for tracking visitor data
 */
router.post('/track', AnalyticsController.trackVisitor);

/**
 * Protected endpoints - require authentication
 */
router.use(authMiddleware);

// Dashboard
router.get('/dashboard', AnalyticsController.getDashboard);

// Summary statistics
router.get('/summary', AnalyticsController.getSummary);

// Trends
router.get('/trends', AnalyticsController.getTrends);

// Top pages
router.get('/pages', AnalyticsController.getTopPages);

// Device statistics
router.get('/devices', AnalyticsController.getDevices);

// Browser statistics
router.get('/browsers', AnalyticsController.getBrowsers);

// Operating system statistics
router.get('/os', AnalyticsController.getOperatingSystems);

// Referrer statistics
router.get('/referrers', AnalyticsController.getReferrers);

// Visitor heatmap
router.get('/heatmap', AnalyticsController.getHeatmap);

// Country statistics
router.get('/countries', AnalyticsController.getCountries);

module.exports = router;
