const router = require('express').Router();
const { body } = require('express-validator');
const donasiController = require('../controllers/donasi.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadBuktiTransfer, uploadQris } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

// ─── Public Routes ──────────────────────────────────────────────────────────────
router.get('/rekening', donasiController.getRekening);
router.get('/summary-public', donasiController.getSummaryPublic);
router.get('/program', donasiController.getActiveProgram);

router.post(
  '/',
  uploadBuktiTransfer.single('buktiTransfer'),
  [
    body('nama').notEmpty().withMessage('Nama donatur diperlukan.'),
    body('jumlah').isNumeric().withMessage('Jumlah infaq harus berupa angka.').isFloat({ min: 1000 }).withMessage('Jumlah minimal Rp 1.000.'),
  ],
  validate,
  donasiController.create
);

// ─── Admin Routes ───────────────────────────────────────────────────────────────
router.get('/summary', authMiddleware, adminOnly, donasiController.getSummary);
router.get('/', authMiddleware, adminOnly, donasiController.getAll);
router.put(
  '/:id/status',
  authMiddleware, adminOnly,
  [body('status').isIn(['PENDING', 'VERIFIED', 'REJECTED']).withMessage('Status tidak valid.')],
  validate,
  donasiController.updateStatus
);

// Rekening admin CRUD
router.post(
  '/rekening',
  authMiddleware, adminOnly,
  uploadQris.single('qrisImage'),
  [
    body('namaBank').notEmpty().withMessage('Nama bank diperlukan.'),
    body('noRekening').notEmpty().withMessage('Nomor rekening diperlukan.'),
    body('atasNama').notEmpty().withMessage('Atas nama diperlukan.'),
  ],
  validate,
  donasiController.createRekening
);
router.put('/rekening/:id', authMiddleware, adminOnly, uploadQris.single('qrisImage'), donasiController.updateRekening);
router.delete('/rekening/:id', authMiddleware, adminOnly, donasiController.deleteRekening);

// Program Infaq admin CRUD
router.get('/program/all', authMiddleware, adminOnly, donasiController.getAllProgram);
router.post(
  '/program',
  authMiddleware, adminOnly,
  [
    body('judul').notEmpty().withMessage('Judul program diperlukan.'),
    body('target').optional({ values: 'falsy' }).isNumeric().withMessage('Target harus berupa angka.'),
  ],
  validate,
  donasiController.createProgram
);
router.put('/program/:id', authMiddleware, adminOnly, donasiController.updateProgram);
router.delete('/program/:id', authMiddleware, adminOnly, donasiController.deleteProgram);

// Program Wakaf public & admin CRUD
router.get('/wakaf', donasiController.getActiveWakaf);
router.get('/wakaf/all', authMiddleware, adminOnly, donasiController.getAllWakaf);
router.post(
  '/wakaf',
  authMiddleware, adminOnly,
  [
    body('kegiatan').notEmpty().withMessage('Kegiatan program wakaf diperlukan.'),
  ],
  validate,
  donasiController.createWakaf
);
router.put('/wakaf/:id', authMiddleware, adminOnly, donasiController.updateWakaf);
router.delete('/wakaf/:id', authMiddleware, adminOnly, donasiController.deleteWakaf);

// Recalculate terkumpul
router.post('/recalc-terkumpul', authMiddleware, adminOnly, donasiController.recalcTerkumpul);

module.exports = router;
