const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

// GET /api/dashboard/summary?bulan=4&tahun=2026
router.get('/summary', authMiddleware, adminOnly, dashboardController.getSummary);

module.exports = router;
