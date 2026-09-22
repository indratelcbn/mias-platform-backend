const router = require('express').Router();
const { body } = require('express-validator');
const kajianController = require('../controllers/kajian.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadKajianFiles } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const kajianValidation = [
  body('judul').notEmpty().withMessage('Judul kajian diperlukan.'),
  body('ustadz').notEmpty().withMessage('Nama ustadz diperlukan.'),
  body('tanggal').notEmpty().withMessage('Tanggal kajian diperlukan.').isISO8601().withMessage('Format tanggal tidak valid.'),
  body('waktu').notEmpty().withMessage('Waktu kajian diperlukan.'),
];

// ─── Public Routes ─────────────────────────────────────────────────────────────
// GET /api/kajian
router.get('/', kajianController.getAll);

// GET /api/kajian/:id
router.get('/:id', kajianController.getById);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
// GET /api/kajian/admin/all
router.get('/admin/all', authMiddleware, adminOnly, kajianController.getAllAdmin);

// POST /api/kajian
router.post(
  '/',
  authMiddleware,
  adminOnly,
  uploadKajianFiles,
  kajianValidation,
  validate,
  kajianController.create
);

// PUT /api/kajian/:id
router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  uploadKajianFiles,
  validate,
  kajianController.update
);

// DELETE /api/kajian/:id
router.delete('/:id', authMiddleware, adminOnly, kajianController.remove);

module.exports = router;
