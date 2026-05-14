// middleware/analytics.middleware.js
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Parse referrer type from referrer URL
 */
const parseReferrerType = (referrer) => {
  if (!referrer) return 'Direct';
  
  const referrerLower = referrer.toLowerCase();
  
  if (referrerLower.includes('google')) return 'Google';
  if (referrerLower.includes('facebook')) return 'Facebook';
  if (referrerLower.includes('whatsapp')) return 'WhatsApp';
  if (referrerLower.includes('instagram')) return 'Instagram';
  if (referrerLower.includes('twitter') || referrerLower.includes('x.com')) return 'Twitter';
  if (referrerLower.includes('youtube')) return 'YouTube';
  if (referrerLower.includes('linkedin')) return 'LinkedIn';
  if (referrerLower.includes('tiktok')) return 'TikTok';
  
  return 'Other';
};

/**
 * Get client IP address
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
};

/**
 * Visitor Tracking Middleware
 * Logs visitor data asynchronously without blocking the response
 */
const visitorTrackingMiddleware = async (req, res, next) => {
  try {
    // Skip tracking for internal/admin routes and static assets
    const pathToSkip = ['/api/', '/admin/', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
    const shouldSkip = pathToSkip.some((path) => req.path.startsWith(path) || req.path.includes(path));
    
    if (shouldSkip) {
      return next();
    }

    // Generate session ID if not exists
    let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Store session ID in cookies or headers for client tracking
    req.sessionId = sessionId;
    res.set('X-Session-ID', sessionId);

    // Extract visitor data
    const visitorData = {
      ipAddress: getClientIp(req),
      pagePath: req.path || '/',
      fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: req.headers['referer'] || null,
      language: req.headers['accept-language'] || null,
      sessionId: sessionId,
      // These fields will be filled by frontend
      browser: req.body?.browser || null,
      browserVersion: req.body?.browserVersion || null,
      operatingSystem: req.body?.operatingSystem || null,
      osVersion: req.body?.osVersion || null,
      deviceType: req.body?.deviceType || null,
      deviceName: req.body?.deviceName || null,
      screenWidth: req.body?.screenWidth ? parseInt(req.body.screenWidth) : null,
      screenHeight: req.body?.screenHeight ? parseInt(req.body.screenHeight) : null,
    };

    // Track asynchronously without blocking response
    setImmediate(async () => {
      try {
        await prisma.visitorLog.create({
          data: visitorData,
        });
      } catch (error) {
        console.error('Error tracking visitor:', error);
      }
    });

    next();
  } catch (error) {
    console.error('Visitor tracking middleware error:', error);
    next();
  }
};

/**
 * Track endpoint - receives detailed visitor data from frontend
 * POST /api/analytics/track
 */
const trackVisitorEndpoint = async (req, res) => {
  try {
    const {
      pagePath,
      fullUrl,
      browser,
      browserVersion,
      operatingSystem,
      osVersion,
      deviceType,
      deviceName,
      referrer,
      userAgent,
      language,
      screenWidth,
      screenHeight,
      sessionId,
    } = req.body;

    // Basic validation
    if (!pagePath) {
      return res.status(400).json({
        success: false,
        message: 'pagePath is required',
      });
    }

    // Rate limiting check - simple spam prevention
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentLogs = await prisma.visitorLog.count({
      where: {
        ipAddress: getClientIp(req),
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    // Allow max 60 requests per minute per IP
    if (recentLogs > 60) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
      });
    }

    // Store visitor log
    const visitorLog = await prisma.visitorLog.create({
      data: {
        ipAddress: getClientIp(req),
        pagePath: pagePath || '/',
        fullUrl: fullUrl || '',
        browser: browser || null,
        browserVersion: browserVersion || null,
        operatingSystem: operatingSystem || null,
        osVersion: osVersion || null,
        deviceType: deviceType || null,
        deviceName: deviceName || null,
        referrer: referrer || null,
        userAgent: userAgent || null,
        language: language || null,
        screenWidth: screenWidth ? parseInt(screenWidth) : null,
        screenHeight: screenHeight ? parseInt(screenHeight) : null,
        sessionId: sessionId || null,
      },
    });

    res.json({
      success: true,
      message: 'Visitor tracked successfully',
      data: {
        logId: visitorLog.id,
        sessionId: visitorLog.sessionId,
      },
    });
  } catch (error) {
    console.error('Error in track visitor endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking visitor',
      error: error.message,
    });
  }
};

module.exports = {
  visitorTrackingMiddleware,
  trackVisitorEndpoint,
  getClientIp,
  parseReferrerType,
};
