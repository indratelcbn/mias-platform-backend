const router = require('express').Router();
const { body } = require('express-validator');
const artikelController = require('../controllers/artikel.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadThumbnail } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const artikelValidation = [
  body('judul').notEmpty().withMessage('Judul artikel diperlukan.'),
  body('konten').notEmpty().withMessage('Konten artikel diperlukan.'),
];

// ─── Public Routes ──────────────────────────────────────────────────────────────
// GET /api/artikel
router.get('/', artikelController.getAll);

// GET /api/artikel/slug/:slug
router.get('/slug/:slug', artikelController.getBySlug);

// GET /api/artikel/:id
router.get('/:id', artikelController.getById);

// ─── Admin Routes ───────────────────────────────────────────────────────────────
// GET /api/artikel/admin/all
router.get('/admin/all', authMiddleware, adminOnly, artikelController.getAllAdmin);

// POST /api/artikel
router.post(
  '/',
  authMiddleware,
  adminOnly,
  uploadThumbnail.single('thumbnail'),
  artikelValidation,
  validate,
  artikelController.create
);

// PUT /api/artikel/:id
router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  uploadThumbnail.single('thumbnail'),
  validate,
  artikelController.update
);

// DELETE /api/artikel/:id
router.delete('/:id', authMiddleware, adminOnly, artikelController.remove);

module.exports = router;
