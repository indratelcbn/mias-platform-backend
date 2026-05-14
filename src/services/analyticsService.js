// services/analyticsService.js
const analyticsRepository = require('../repositories/analyticsRepository');

class AnalyticsService {
  /**
   * Parse date range from filter type
   */
  parseFilterDates(filterType) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    let startDate;

    switch (filterType) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisYear':
        startDate = new Date();
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    const [
      totalVisitors,
      uniqueVisitors,
      totalPageViews,
      bounceRate,
      avgSessionDuration,
    ] = await Promise.all([
      analyticsRepository.getTotalVisitors(startDate, endDate),
      analyticsRepository.getUniqueVisitorsCount(startDate, endDate),
      analyticsRepository.getTotalPageViews(startDate, endDate),
      analyticsRepository.getBounceRate(startDate, endDate),
      analyticsRepository.getAverageSessionDuration(startDate, endDate),
    ]);

    // Calculate visitors today for comparison
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const visitorsToday = await analyticsRepository.getTotalVisitors(todayStart, todayEnd);

    // Calculate this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setHours(23, 59, 59, 999);
    const visitorsThisWeek = await analyticsRepository.getTotalVisitors(weekStart, weekEnd);

    // Calculate this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date();
    monthEnd.setHours(23, 59, 59, 999);
    const visitorsThisMonth = await analyticsRepository.getTotalVisitors(monthStart, monthEnd);

    return {
      totalVisitors,
      visitorsToday,
      visitorsThisWeek,
      visitorsThisMonth,
      totalPageViews,
      uniqueVisitors,
      bounceRate: parseFloat(bounceRate),
      avgSessionDuration: parseFloat(avgSessionDuration),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  /**
   * Get visitor trends
   */
  async getVisitorTrends(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    const trend = await analyticsRepository.getVisitorsTrend(startDate, endDate);
    const uniqueByDate = await analyticsRepository.getUniqueVisitorsByDate(startDate, endDate);

    // Merge data
    const merged = {};
    trend.forEach((item) => {
      merged[item.date] = { totalVisitors: item.count, uniqueVisitors: 0 };
    });

    uniqueByDate.forEach((item) => {
      if (merged[item.date]) {
        merged[item.date].uniqueVisitors = item.uniqueVisitors;
      } else {
        merged[item.date] = { totalVisitors: 0, uniqueVisitors: item.uniqueVisitors };
      }
    });

    return Object.entries(merged)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, data]) => ({
        date,
        ...data,
      }));
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    const [summary, trends, topPages, devices, browsers, os, referrers, heatmap] = await Promise.all([
      this.getDashboardSummary(filterType, customStartDate, customEndDate),
      this.getVisitorTrends(filterType, customStartDate, customEndDate),
      this.getTopPages(filterType, customStartDate, customEndDate, 10),
      this.getDeviceStats(filterType, customStartDate, customEndDate),
      this.getBrowserStats(filterType, customStartDate, customEndDate),
      this.getOSStats(filterType, customStartDate, customEndDate),
      this.getReferrerStats(filterType, customStartDate, customEndDate),
      this.getHeatmapData(filterType, customStartDate, customEndDate),
    ]);

    return {
      summary,
      trends,
      topPages,
      devices,
      browsers,
      os,
      referrers,
      heatmap,
    };
  }

  /**
   * Get top pages
   */
  async getTopPages(filterType = 'last30days', customStartDate = null, customEndDate = null, limit = 10) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    return await analyticsRepository.getPopularPages(startDate, endDate, limit);
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    return await analyticsRepository.getDeviceStatistics(startDate, endDate);
  }

  /**
   * Get browser statistics
   */
  async getBrowserStats(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    return await analyticsRepository.getBrowserStatistics(startDate, endDate);
  }

  /**
   * Get OS statistics
   */
  async getOSStats(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    return await analyticsRepository.getOSStatistics(startDate, endDate);
  }

  /**
   * Get referrer statistics
   */
  async getReferrerStats(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    return await analyticsRepository.getReferrerStatistics(startDate, endDate);
  }

  /**
   * Get heatmap data
   */
  async getHeatmapData(filterType = 'last30days', customStartDate = null, customEndDate = null) {
    let startDate, endDate;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = this.parseFilterDates(filterType);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    const heatmap = await analyticsRepository.getVisitorHeatmap(startDate, endDate);

    // Format for heatmap display
    const matrix = Array(24)
      .fill(null)
      .map(() => Array(7).fill(0));

    heatmap.forEach((item) => {
      if (item.hour < 24 && item.dayOfWeek < 7) {
        matrix[item.hour][item.dayOfWeek] = item.visitorCount;
      }
    });

    return matrix;
  }
}

module.exports = new AnalyticsService();
