const router = require('express').Router();
const { body } = require('express-validator');
const donasiController = require('../controllers/donasi.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadBuktiTransfer, uploadQris } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

// ─── Public Routes ──────────────────────────────────────────────────────────────
router.get('/rekening', donasiController.getRekening);
router.get('/program', donasiController.getActiveProgram);

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

// Program Donasi admin CRUD
router.get('/program/all', authMiddleware, adminOnly, donasiController.getAllProgram);
router.post(
  '/program',
  authMiddleware, adminOnly,
  [
    body('judul').notEmpty().withMessage('Judul program diperlukan.'),
    body('target').isNumeric().withMessage('Target harus berupa angka.'),
  ],
  validate,
  donasiController.createProgram
);
router.put('/program/:id', authMiddleware, adminOnly, donasiController.updateProgram);
router.delete('/program/:id', authMiddleware, adminOnly, donasiController.deleteProgram);

module.exports = router;
