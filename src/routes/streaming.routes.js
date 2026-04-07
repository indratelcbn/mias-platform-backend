const router = require('express').Router();
const { body } = require('express-validator');
const streamingController = require('../controllers/streaming.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const streamingValidation = [
  body('judul').notEmpty().withMessage('Judul streaming diperlukan.'),
  body('url').notEmpty().withMessage('URL streaming diperlukan.').isURL().withMessage('Format URL tidak valid.'),
];

// ─── Public Routes ─────────────────────────────────────────────────────────────
// GET /api/streaming/active
router.get('/active', streamingController.getActive);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
// GET /api/streaming
router.get('/', authMiddleware, adminOnly, streamingController.getAll);

// GET /api/streaming/:id
router.get('/:id', authMiddleware, adminOnly, streamingController.getById);

// POST /api/streaming
router.post(
  '/',
  authMiddleware,
  adminOnly,
  streamingValidation,
  validate,
  streamingController.create
);

// PUT /api/streaming/:id
router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  validate,
  streamingController.update
);

// PATCH /api/streaming/:id/set-live
router.patch('/:id/set-live', authMiddleware, adminOnly, streamingController.setLive);

// DELETE /api/streaming/:id
router.delete('/:id', authMiddleware, adminOnly, streamingController.remove);

module.exports = router;
