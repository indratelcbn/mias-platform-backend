const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username diperlukan.'),
    body('password').notEmpty().withMessage('Password diperlukan.'),
  ],
  validate,
  authController.login
);

// GET /api/auth/profile  (protected)
router.get('/profile', authMiddleware, authController.getProfile);

// PUT /api/auth/change-password  (protected)
router.put(
  '/change-password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('Password lama diperlukan.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter.'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
