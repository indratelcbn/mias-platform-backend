// controllers/analyticsController.js
const analyticsService = require('../services/analyticsService');
const { trackVisitorEndpoint } = require('../middleware/analytics.middleware');

class AnalyticsController {
  /**
   * POST /api/analytics/track
   * Track visitor data from frontend
   */
  static async trackVisitor(req, res) {
    return await trackVisitorEndpoint(req, res);
  }

  /**
   * GET /api/analytics/dashboard
   * Get full dashboard data
   */
  static async getDashboard(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const data = await analyticsService.getDashboardData(filter, startDate, endDate);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/summary
   * Get summary statistics
   */
  static async getSummary(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const summary = await analyticsService.getDashboardSummary(filter, startDate, endDate);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error in getSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching summary',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/trends
   * Get visitor trends
   */
  static async getTrends(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const trends = await analyticsService.getVisitorTrends(filter, startDate, endDate);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      console.error('Error in getTrends:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching trends',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/pages
   * Get top pages
   */
  static async getTopPages(req, res) {
    try {
      const { filter = 'last30days', limit = 10, startDate, endDate } = req.query;

      const pages = await analyticsService.getTopPages(filter, startDate, endDate, parseInt(limit));

      res.json({
        success: true,
        data: pages,
      });
    } catch (error) {
      console.error('Error in getTopPages:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching top pages',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/devices
   * Get device statistics
   */
  static async getDevices(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const devices = await analyticsService.getDeviceStats(filter, startDate, endDate);

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      console.error('Error in getDevices:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching device statistics',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/browsers
   * Get browser statistics
   */
  static async getBrowsers(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const browsers = await analyticsService.getBrowserStats(filter, startDate, endDate);

      res.json({
        success: true,
        data: browsers,
      });
    } catch (error) {
      console.error('Error in getBrowsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching browser statistics',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/os
   * Get operating system statistics
   */
  static async getOperatingSystems(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const os = await analyticsService.getOSStats(filter, startDate, endDate);

      res.json({
        success: true,
        data: os,
      });
    } catch (error) {
      console.error('Error in getOperatingSystems:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching OS statistics',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/referrers
   * Get referrer statistics
   */
  static async getReferrers(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const referrers = await analyticsService.getReferrerStats(filter, startDate, endDate);

      res.json({
        success: true,
        data: referrers,
      });
    } catch (error) {
      console.error('Error in getReferrers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching referrer statistics',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/heatmap
   * Get visitor heatmap
   */
  static async getHeatmap(req, res) {
    try {
      const { filter = 'last30days', startDate, endDate } = req.query;

      const heatmap = await analyticsService.getHeatmapData(filter, startDate, endDate);

      res.json({
        success: true,
        data: heatmap,
      });
    } catch (error) {
      console.error('Error in getHeatmap:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching heatmap data',
        error: error.message,
      });
    }
  }
}

module.exports = AnalyticsController;
