const router = require('express').Router();
const { body } = require('express-validator');
const sosialController = require('../controllers/sosial.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadSosial } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const VALID_KATEGORI = [
  'SANTUNAN_ANAK_YATIM',
  'AIR_GALON_GRATIS',
  'LAYANAN_KESEHATAN_IBU_ANAK',
  'ARMALAH_AL_MISKIN',
  'BANTUAN_PENGOBATAN',
  'ZAKAT_MAAL',
];

const createValidation = [
  body('judul').optional(),
  body('kategori').isIn(VALID_KATEGORI).withMessage('Kategori tidak valid.'),
];

// ─── Admin Routes (must be before /:kategori) ─────────────────────────────────
// GET /api/sosial/admin/all
router.get('/admin/all', authMiddleware, adminOnly, sosialController.getAllAdmin);

// ─── Public Routes ─────────────────────────────────────────────────────────────
// GET /api/sosial/:kategori
router.get('/:kategori', sosialController.getByKategori);

// POST /api/sosial
router.post(
  '/',
  authMiddleware,
  adminOnly,
  uploadSosial.array('foto', 20),
  createValidation,
  validate,
  sosialController.create
);

// PUT /api/sosial/:id
router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  uploadSosial.single('foto'),
  validate,
  sosialController.update
);

// DELETE /api/sosial/:id
router.delete('/:id', authMiddleware, adminOnly, sosialController.remove);

module.exports = router;
