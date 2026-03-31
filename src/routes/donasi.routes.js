const router = require('express').Router();
const { body } = require('express-validator');
const donasiController = require('../controllers/donasi.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadBuktiTransfer } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

// ─── Public Routes ──────────────────────────────────────────────────────────────
// GET /api/donasi/rekening
router.get('/rekening', donasiController.getRekening);

// POST /api/donasi  (konfirmasi donasi)
router.post(
  '/',
  uploadBuktiTransfer.single('buktiTransfer'),
  [
    body('nama').notEmpty().withMessage('Nama donatur diperlukan.'),
    body('jumlah').isNumeric().withMessage('Jumlah donasi harus berupa angka.').isFloat({ min: 1000 }).withMessage('Jumlah minimal Rp 1.000.'),
  ],
  validate,
  donasiController.create
);

// ─── Admin Routes ───────────────────────────────────────────────────────────────
// GET /api/donasi/summary
router.get('/summary', authMiddleware, adminOnly, donasiController.getSummary);

// GET /api/donasi
router.get('/', authMiddleware, adminOnly, donasiController.getAll);

// PUT /api/donasi/:id/status
router.put(
  '/:id/status',
  authMiddleware,
  adminOnly,
  [
    body('status')
      .isIn(['PENDING', 'VERIFIED', 'REJECTED'])
      .withMessage('Status tidak valid.'),
  ],
  validate,
  donasiController.updateStatus
);

module.exports = router;
