const router = require('express').Router();
const { body } = require('express-validator');
const financeController = require('../controllers/finance.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadBuktiTransfer } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const multer = require('multer');
const path = require('path');

// ─── CSV Upload Configuration ───────────────────────────────────────────────────
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/bank_csv'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bank-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return cb(new Error('Hanya file CSV yang diperbolehkan.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ACCOUNTS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/accounts', authMiddleware, adminOnly, financeController.getAllAccounts);
router.get('/accounts/with-balance', authMiddleware, adminOnly, financeController.getAllAccountsWithBalance);
router.get('/accounts/:id', authMiddleware, adminOnly, financeController.getAccountById);
router.get('/accounts/:id/balance', authMiddleware, adminOnly, financeController.getAccountBalance);

router.post(
  '/accounts',
  authMiddleware,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Nama akun diperlukan.'),
    body('type').isIn(['CASH', 'BANK']).withMessage('Tipe akun harus CASH atau BANK.'),
  ],
  validate,
  financeController.createAccount
);

router.put(
  '/accounts/:id',
  authMiddleware,
  adminOnly,
  [
    body('name').notEmpty().withMessage('Nama akun diperlukan.'),
    body('type').isIn(['CASH', 'BANK']).withMessage('Tipe akun harus CASH atau BANK.'),
  ],
  validate,
  financeController.updateAccount
);

router.delete('/accounts/:id', authMiddleware, adminOnly, financeController.deleteAccount);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TRANSACTIONS ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════


// Export Excel/PDF Transaksi Keuangan
router.get('/transactions/export/excel', authMiddleware, adminOnly, financeController.exportTransactionsExcel);
router.get('/transactions/export/pdf', authMiddleware, adminOnly, financeController.exportTransactionsPDF);

router.get('/transactions', authMiddleware, adminOnly, financeController.getAllTransactions);
router.get('/transactions/:id', authMiddleware, adminOnly, financeController.getTransactionById);

router.post(
  '/transactions',
  authMiddleware,
  adminOnly,
  uploadBuktiTransfer.single('attachment'),
  [
    body('accountId').notEmpty().withMessage('Akun diperlukan.'),
    body('transactionDate').notEmpty().withMessage('Tanggal transaksi diperlukan.'),
    body('type').isIn(['IN', 'OUT']).withMessage('Tipe transaksi harus IN atau OUT.'),
    body('amount').isNumeric().withMessage('Jumlah harus berupa angka.').isFloat({ min: 0 }).withMessage('Jumlah minimal 0.'),
  ],
  validate,
  financeController.createTransaction
);

router.put(
  '/transactions/:id',
  authMiddleware,
  adminOnly,
  uploadBuktiTransfer.single('attachment'),
  [
    body('accountId').notEmpty().withMessage('Akun diperlukan.'),
    body('transactionDate').notEmpty().withMessage('Tanggal transaksi diperlukan.'),
    body('type').isIn(['IN', 'OUT']).withMessage('Tipe transaksi harus IN atau OUT.'),
    body('amount').isNumeric().withMessage('Jumlah harus berupa angka.').isFloat({ min: 0 }).withMessage('Jumlah minimal 0.'),
  ],
  validate,
  financeController.updateTransaction
);

router.delete('/transactions/:id', authMiddleware, adminOnly, financeController.deleteTransaction);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD & REPORTS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/dashboard', authMiddleware, adminOnly, financeController.getDashboardSummary);
router.get('/fund-tracking', authMiddleware, adminOnly, financeController.getFundTracking);
router.get('/charts/trends', authMiddleware, adminOnly, financeController.getTrendsData);
router.get('/reports/monthly', authMiddleware, adminOnly, financeController.getMonthlyReport);
router.get('/reports/monthly/excel', authMiddleware, adminOnly, financeController.exportMonthlyReportExcel);
router.get('/reports/monthly/pdf', authMiddleware, adminOnly, financeController.exportMonthlyReportPDF);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROGRAMS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/programs', authMiddleware, adminOnly, financeController.getAllPrograms);
router.post('/programs/parse-unique-code', authMiddleware, adminOnly, financeController.parseAmountWithUniqueCode);
router.get('/programs/statistics', authMiddleware, adminOnly, financeController.getProgramStatistics);
router.post('/programs/sync', authMiddleware, adminOnly, financeController.syncAllProgramsCollectedAmount);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BANK IMPORTS ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/bank-imports', authMiddleware, adminOnly, financeController.getAllBankImports);
router.get('/bank-imports/:id', authMiddleware, adminOnly, financeController.getBankImportDetails);
router.delete('/bank-imports/:id', authMiddleware, adminOnly, financeController.deleteBankImport);
router.get('/bank-imports/unmatched', authMiddleware, adminOnly, financeController.getUnmatchedBankTransactions);

router.post(
  '/bank-imports',
  authMiddleware,
  adminOnly,
  uploadCSV.single('file'),
  [
    body('accountId').notEmpty().withMessage('Akun bank diperlukan.'),
    body('bankFormat').optional().isIn(['STANDARD', 'BSI', 'BCA', 'MANDIRI', 'BNI', 'BRI']).withMessage('Format bank tidak valid.'),
  ],
  validate,
  financeController.importBankCSV
);

router.post('/bank-imports/:id/confirm', authMiddleware, adminOnly, financeController.confirmBankImport);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RECONCILIATION ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/reconciliation', authMiddleware, adminOnly, financeController.getAllReconciliations);
router.get('/reconciliation/summary', authMiddleware, adminOnly, financeController.getReconciliationSummary);
router.get('/reconciliation/suggestions/:bankImportDetailId', authMiddleware, adminOnly, financeController.getSuggestions);

router.post('/reconciliation/auto-match', authMiddleware, adminOnly, financeController.autoMatch);
router.post('/reconciliation/manual-match', authMiddleware, adminOnly, financeController.manualMatch);
router.post('/reconciliation/mark-unmatched', authMiddleware, adminOnly, financeController.markAsUnmatched);
router.put('/reconciliation/:id/unmatch', authMiddleware, adminOnly, financeController.unmatch);
router.put('/reconciliation/:id/assign-program', authMiddleware, adminOnly, financeController.assignProgram);

module.exports = router;
