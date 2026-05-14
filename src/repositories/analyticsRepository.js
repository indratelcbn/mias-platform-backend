// repositories/analyticsRepository.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsRepository {
  /**
   * Get daily analytics summary
   */
  async getDailyAnalytics(startDate, endDate) {
    return await prisma.dailyAnalytics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get unique visitors count by date range
   */
  async getUniqueVisitorsCount(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['sessionId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });
    return result.length;
  }

  /**
   * Get total visitors by date range
   */
  async getTotalVisitors(startDate, endDate) {
    return await prisma.visitorLog.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get total page views by date range
   */
  async getTotalPageViews(startDate, endDate) {
    return await prisma.visitorLog.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get visitors trend by day
   */
  async getVisitorsTrend(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date (without time)
    const grouped = {};
    result.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + item._count;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Get popular pages
   */
  async getPopularPages(startDate, endDate, limit = 10) {
    const logs = await prisma.visitorLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        pagePath: true,
      },
    });

    const counts = logs.reduce((accumulator, log) => {
      const pagePath = log.pagePath || '/';
      accumulator[pagePath] = (accumulator[pagePath] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([pagePath, totalViews]) => ({ pagePath, totalViews }))
      .sort((first, second) => second.totalViews - first.totalViews)
      .slice(0, limit);
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['deviceType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const total = result.reduce((sum, item) => sum + item._count, 0);

    return result.map((item) => ({
      deviceType: item.deviceType || 'Unknown',
      count: item._count,
      percentage: ((item._count / total) * 100).toFixed(2),
    }));
  }

  /**
   * Get browser statistics
   */
  async getBrowserStatistics(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['browser'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const total = result.reduce((sum, item) => sum + item._count, 0);

    return result
      .filter((item) => item.browser)
      .map((item) => ({
        browser: item.browser,
        count: item._count,
        percentage: ((item._count / total) * 100).toFixed(2),
      }));
  }

  /**
   * Get OS statistics
   */
  async getOSStatistics(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['operatingSystem'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const total = result.reduce((sum, item) => sum + item._count, 0);

    return result
      .filter((item) => item.operatingSystem)
      .map((item) => ({
        operatingSystem: item.operatingSystem,
        count: item._count,
        percentage: ((item._count / total) * 100).toFixed(2),
      }));
  }

  /**
   * Get referrer statistics
   */
  async getReferrerStatistics(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['referrer'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const total = result.reduce((sum, item) => sum + item._count, 0);

    return result
      .filter((item) => item.referrer)
      .map((item) => ({
        referrer: item.referrer,
        count: item._count,
        percentage: ((item._count / total) * 100).toFixed(2),
      }));
  }

  /**
   * Get visitor heatmap by hour
   */
  async getVisitorHeatmap(startDate, endDate) {
    const result = await prisma.visitorLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by hour and day of week
    const heatmap = {};
    result.forEach((log) => {
      const date = new Date(log.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${hour}-${dayOfWeek}`;

      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    return Object.entries(heatmap).map(([key, count]) => {
      const [hour, dayOfWeek] = key.split('-');
      return {
        hour: parseInt(hour),
        dayOfWeek: parseInt(dayOfWeek),
        visitorCount: count,
      };
    });
  }

  /**
   * Get bounce rate
   */
  async getBounceRate(startDate, endDate) {
    // Simple bounce rate: sessions with only 1 page view
    const allSessions = await prisma.visitorLog.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    if (allSessions.length === 0) return 0;

    const bouncedSessions = allSessions.filter((session) => session._count === 1).length;
    return ((bouncedSessions / allSessions.length) * 100).toFixed(2);
  }

  /**
   * Get average session duration
   */
  async getAverageSessionDuration(startDate, endDate) {
    const sessions = await prisma.visitorLog.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    if (sessions.length === 0) return 0;

    let totalDuration = 0;
    sessions.forEach((session) => {
      if (session._min.createdAt && session._max.createdAt) {
        const duration = (session._max.createdAt - session._min.createdAt) / 1000; // in seconds
        totalDuration += duration;
      }
    });

    return (totalDuration / sessions.length).toFixed(2);
  }

  /**
   * Get unique visitors by date
   */
  async getUniqueVisitorsByDate(startDate, endDate) {
    const result = await prisma.visitorLog.groupBy({
      by: ['createdAt', 'sessionId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by date
    const grouped = {};
    result.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = new Set();
      }
      grouped[date].add(item.sessionId);
    });

    return Object.entries(grouped).map(([date, sessions]) => ({
      date,
      uniqueVisitors: sessions.size,
    }));
  }
}

module.exports = new AnalyticsRepository();
