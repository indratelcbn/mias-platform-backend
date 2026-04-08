const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { getPublic, update } = require('../controllers/setting.controller');

// Public — anyone can read social media links
router.get('/', getPublic);

// Admin — update links
router.put('/', authMiddleware, update);

module.exports = router;
