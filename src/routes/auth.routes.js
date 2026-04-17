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
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.')
      .matches(/[a-z]/).withMessage('Password harus mengandung huruf kecil.')
      .matches(/[A-Z]/).withMessage('Password harus mengandung huruf besar.')
      .matches(/[0-9]/).withMessage('Password harus mengandung angka.')
      .matches(/[^a-zA-Z0-9]/).withMessage('Password harus mengandung simbol.'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
