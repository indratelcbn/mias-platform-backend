const router = require('express').Router();
const { body } = require('express-validator');
const artikelController = require('../controllers/artikel.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadThumbnail, uploadGaleri } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const artikelValidation = [
  body('judul').notEmpty().withMessage('Judul artikel diperlukan.'),
  body('konten').notEmpty().withMessage('Konten artikel diperlukan.'),
];

// ─── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', artikelController.getAll);
router.get('/slug/:slug', artikelController.getBySlug);

// ─── Admin Routes ───────────────────────────────────────────────────────────────
router.get('/admin/all', authMiddleware, adminOnly, artikelController.getAllAdmin);

// Inline image upload untuk TipTap editor
router.post(
  '/upload-image',
  authMiddleware,
  adminOnly,
  uploadGaleri.single('image'),
  artikelController.uploadInlineImage
);

router.get('/:id', artikelController.getById);

router.post(
  '/',
  authMiddleware,
  adminOnly,
  uploadThumbnail.single('thumbnail'),
  artikelValidation,
  validate,
  artikelController.create
);

router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  uploadThumbnail.single('thumbnail'),
  validate,
  artikelController.update
);

router.delete('/:id', authMiddleware, adminOnly, artikelController.remove);

module.exports = router;
