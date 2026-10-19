const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/ujian.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// ─── Validasi ─────────────────────────────────────────────────────────────────
const ujianValidation = [
  body('judul').notEmpty().withMessage('Judul ujian wajib diisi.'),
  body('kodeUjian').notEmpty().withMessage('Kode ujian wajib diisi.'),
  body('tanggalMulai').isISO8601().withMessage('Tanggal mulai tidak valid.'),
  body('tanggalSelesai').isISO8601().withMessage('Tanggal selesai tidak valid.'),
  body('durasi').isInt({ min: 1 }).withMessage('Durasi harus angka positif (menit).'),
  body('passingGrade').optional().isInt({ min: 0, max: 100 }).withMessage('Passing grade 0–100.'),
  body('maxPercobaan').optional().isInt({ min: 1 }).withMessage('Max percobaan minimal 1.'),
];

const soalValidation = [
  body('teks').notEmpty().withMessage('Teks soal wajib diisi.'),
  body('pilihanA').notEmpty().withMessage('Pilihan A wajib diisi.'),
  body('pilihanB').notEmpty().withMessage('Pilihan B wajib diisi.'),
  body('pilihanC').notEmpty().withMessage('Pilihan C wajib diisi.'),
  body('pilihanD').notEmpty().withMessage('Pilihan D wajib diisi.'),
  body('kunciJawaban').isIn(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd']).withMessage('Kunci jawaban harus A/B/C/D.'),
  body('bobot').optional().isInt({ min: 1 }).withMessage('Bobot minimal 1.'),
];

// ─── Publik (tanpa auth) ──────────────────────────────────────────────────────
router.post('/masuk', ctrl.masukUjian);
router.get('/sesi/:pesertaId', ctrl.getSesi);
router.put('/sesi/:pesertaId/jawab', ctrl.simpanJawaban);
router.post('/sesi/:pesertaId/submit', ctrl.submitUjian);
router.get('/sesi/:pesertaId/hasil', ctrl.getHasil);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin', authMiddleware, adminOnly, ctrl.listUjian);
router.post('/admin', authMiddleware, adminOnly, ujianValidation, validate, ctrl.createUjian);
router.get('/admin/:id', authMiddleware, adminOnly, ctrl.getUjian);
router.put('/admin/:id', authMiddleware, adminOnly, validate, ctrl.updateUjian);
router.delete('/admin/:id', authMiddleware, adminOnly, ctrl.deleteUjian);
router.patch('/admin/:id/status', authMiddleware, adminOnly, ctrl.updateStatus);

// Soal
router.get('/admin/:id/soal', authMiddleware, adminOnly, ctrl.listSoal);
router.post('/admin/:id/soal', authMiddleware, adminOnly, soalValidation, validate, ctrl.createSoal);
router.put('/admin/soal/:soalId', authMiddleware, adminOnly, validate, ctrl.updateSoal);
router.delete('/admin/soal/:soalId', authMiddleware, adminOnly, ctrl.deleteSoal);

// Import soal
router.post('/admin/:id/import-soal/preview', authMiddleware, adminOnly, ctrl.previewImport);
router.post('/admin/:id/import-soal/confirm', authMiddleware, adminOnly, ctrl.confirmImport);

// Peserta & rekap
router.get('/admin/:id/peserta', authMiddleware, adminOnly, ctrl.listPeserta);
router.get('/admin/:id/rekap', authMiddleware, adminOnly, ctrl.rekapNilai);

module.exports = router;
