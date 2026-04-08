const router = require('express').Router();
const { body } = require('express-validator');
const pendidikanController = require('../controllers/pendidikan.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadPendidikan } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const VALID_KATEGORI = [
  'TAHSIN_IKHWAN',
  'TAHSIN_AKHWAT',
  'BAHASA_ARAB_IKHWAN',
  'BAHASA_ARAB_AKHWAT',
  'TPQ',
];

const fotoCreateValidation = [
  body('judul').notEmpty().withMessage('Judul foto diperlukan.'),
  body('kategori').isIn(VALID_KATEGORI).withMessage('Kategori tidak valid.'),
  body('tahun').optional().isInt({ min: 2000, max: 2100 }).withMessage('Tahun tidak valid.'),
];

const infoUpsertValidation = [
  body('pengajar').notEmpty().withMessage('Pengajar diperlukan.'),
  body('jumlahPenuntutIlmu').optional().isInt({ min: 0 }).withMessage('Jumlah penuntut ilmu harus angka positif.'),
  body('kitab').notEmpty().withMessage('Kitab diperlukan.'),
];

// ─── Admin Routes (must be before /:kategori) ─────────────────────────────────

// GET /api/pendidikan/admin/all-info
router.get('/admin/all-info', authMiddleware, adminOnly, pendidikanController.getAllInfo);

// GET /api/pendidikan/admin/fotos
router.get('/admin/fotos', authMiddleware, adminOnly, pendidikanController.getAllFotoAdmin);

// PUT /api/pendidikan/admin/info/:kategori  (upsert)
router.put(
  '/admin/info/:kategori',
  authMiddleware,
  adminOnly,
  infoUpsertValidation,
  validate,
  pendidikanController.upsertInfo
);

// POST /api/pendidikan/foto
router.post(
  '/foto',
  authMiddleware,
  adminOnly,
  uploadPendidikan.single('foto'),
  fotoCreateValidation,
  validate,
  pendidikanController.createFoto
);

// PUT /api/pendidikan/foto/:id
router.put(
  '/foto/:id',
  authMiddleware,
  adminOnly,
  uploadPendidikan.single('foto'),
  validate,
  pendidikanController.updateFoto
);

// DELETE /api/pendidikan/foto/:id
router.delete('/foto/:id', authMiddleware, adminOnly, pendidikanController.removeFoto);

// ─── Public Routes ─────────────────────────────────────────────────────────────

// GET /api/pendidikan/:kategori
router.get('/:kategori', pendidikanController.getByKategori);

module.exports = router;
