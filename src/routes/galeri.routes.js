const router = require('express').Router();
const { body } = require('express-validator');
const galeriController = require('../controllers/galeri.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadGaleri } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const galeriValidation = [
  body('judul').optional(),
  body('kategori').isIn(['RAMADHAN', 'SHOLAT_IED']).withMessage('Kategori tidak valid.'),
  body('tahun').isInt({ min: 2000, max: 2100 }).withMessage('Tahun tidak valid.'),
  body('urutan').optional().isInt({ min: 0, max: 9999 }).withMessage('Urutan tidak valid.'),
];

// ─── Public Routes ─────────────────────────────────────────────────────────────
// GET /api/galeri?kategori=RAMADHAN
router.get('/', galeriController.getAll);

// GET /api/galeri/:id
router.get('/:id', galeriController.getById);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
// GET /api/galeri/admin/all
router.get('/admin/all', authMiddleware, adminOnly, galeriController.getAllAdmin);

// POST /api/galeri
router.post(
  '/',
  authMiddleware,
  adminOnly,
  uploadGaleri.array('foto', 20),
  galeriValidation,
  validate,
  galeriController.create
);

// PUT /api/galeri/:id
router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  uploadGaleri.single('foto'),
  body('tahun').optional().isInt({ min: 2000, max: 2100 }).withMessage('Tahun tidak valid.'),
  body('urutan').optional().isInt({ min: 0, max: 9999 }).withMessage('Urutan tidak valid.'),
  validate,
  galeriController.update
);

// DELETE /api/galeri/:id
router.delete('/:id', authMiddleware, adminOnly, galeriController.remove);

module.exports = router;
