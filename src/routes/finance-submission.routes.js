const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/finance-submission.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { uploadBuktiTransfer } = require('../middleware/upload.middleware');

// Semua route butuh auth + admin (termasuk VIEWER)
router.use(authMiddleware, adminOnly);

// ═══ LIST & DETAIL ═════════════════════════════════════════════════════════════

router.get('/', controller.getAllSubmissions);
router.get('/summary', controller.getSubmissionSummary);

// ═══ REKENING (Pencairan) ════════════════════ harus sebelum /:id
router.get('/rekening/list', controller.getSubmissionRekening);
router.post('/rekening', controller.createSubmissionRekening);

router.get('/:id', controller.getSubmissionById);

// ═══ CRUD ══════════════════════════════════════════════════════════════════════

router.post(
  '/',
  [
    body('judul').notEmpty().withMessage('Judul pengajuan wajib diisi.'),
    body('items').isArray({ min: 1 }).withMessage('Minimal satu item pengajuan.'),
  ],
  validate,
  controller.createSubmission
);

router.put(
  '/:id',
  [
    body('judul').optional().notEmpty().withMessage('Judul tidak boleh kosong.'),
  ],
  validate,
  controller.updateSubmission
);

router.delete('/:id', controller.deleteSubmission);

// ═══ WORKFLOW ═══════════════════════════════════════════════════════════════════

router.post('/:id/submit', controller.submitSubmission);
router.post('/:id/approve', controller.approveSubmission);
router.post('/:id/reject', [
  body('rejectionNote').notEmpty().withMessage('Alasan penolakan wajib diisi.'),
], validate, controller.rejectSubmission);
router.post('/:id/disburse', uploadBuktiTransfer.single('buktiPencairan'), controller.disburseSubmission);

// ═══ PDF EXPORT ═════════════════════════════════════════════════════════════════

router.get('/export/pdf/list', controller.exportSubmissionsListPDF);
router.get('/:id/pdf', controller.exportSubmissionPDF);

module.exports = router;
