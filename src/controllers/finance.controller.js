// Export all transactions as Excel
const exportTransactionsExcel = async (req, res, next) => {
  try {
    // Ambil semua transaksi sesuai filter (tanpa paginasi)
    const { data } = await financeService.getAllTransactions({ ...req.query, page: 1, limit: 10000 });
    const buffer = await financeExportService.generateTransactionsExcel(data);
    const filename = `Transaksi-Keuangan.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

// Export all transactions as PDF
const exportTransactionsPDF = async (req, res, next) => {
  try {
    // Ambil semua transaksi sesuai filter (tanpa paginasi)
    const { data } = await financeService.getAllTransactions({ ...req.query, page: 1, limit: 10000 });
    const buffer = await financeExportService.generateTransactionsPDF(data);
    const filename = `Transaksi-Keuangan.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
const financeService = require('../services/finance.service');
const financeProgramService = require('../services/finance-program.service');
const financeBankService = require('../services/finance-bank.service');
const financeReconciliationService = require('../services/finance-reconciliation.service');
const financeExportService = require('../services/finance-export.service');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ACCOUNTS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const getAllAccounts = async (req, res, next) => {
  try {
    const result = await financeService.getAllAccounts(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAccountById = async (req, res, next) => {
  try {
    const data = await financeService.getAccountById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createAccount = async (req, res, next) => {
  try {
    const data = await financeService.createAccount(req.body);
    res.status(201).json({ success: true, message: 'Akun berhasil ditambahkan.', data });
  } catch (err) {
    next(err);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const data = await financeService.updateAccount(req.params.id, req.body);
    res.json({ success: true, message: 'Akun berhasil diperbarui.', data });
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await financeService.deleteAccount(req.params.id);
    res.json({ success: true, message: 'Akun berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

const getAccountBalance = async (req, res, next) => {
  try {
    const balance = await financeService.getAccountBalance(req.params.id);
    res.json({ success: true, data: { balance } });
  } catch (err) {
    next(err);
  }
};

const getAllAccountsWithBalance = async (req, res, next) => {
  try {
    const data = await financeService.getAllAccountsWithBalance();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TRANSACTIONS ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const getAllTransactions = async (req, res, next) => {
  try {
    const result = await financeService.getAllTransactions(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const data = await financeService.getTransactionById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.attachment = `/uploads/bukti_transfer/${req.file.filename}`;
    }
    const data = await financeService.createTransaction(payload);
    res.status(201).json({ success: true, message: 'Transaksi berhasil ditambahkan.', data });
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.attachment = `/uploads/bukti_transfer/${req.file.filename}`;
    }
    const data = await financeService.updateTransaction(req.params.id, payload);
    res.json({ success: true, message: 'Transaksi berhasil diperbarui.', data });
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    await financeService.deleteTransaction(req.params.id);
    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD & REPORTS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const getDashboardSummary = async (req, res, next) => {
  try {
    const data = await financeService.getDashboardSummary(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getFundTracking = async (req, res, next) => {
  try {
    const data = await financeService.getFundTracking();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const data = await financeService.getMonthlyReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const exportMonthlyReportExcel = async (req, res, next) => {
  try {
    const report = await financeService.getMonthlyReport(req.query);
    const buffer = await financeExportService.generateMonthlyReportExcel(report);
    const filename = `Laporan-Keuangan-${report.year}-${String(report.month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

const exportMonthlyReportPDF = async (req, res, next) => {
  try {
    const report = await financeService.getMonthlyReport(req.query);
    const buffer = await financeExportService.generateMonthlyReportPDF(report);
    const filename = `Laporan-Keuangan-${report.year}-${String(report.month).padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROGRAMS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const getAllPrograms = async (req, res, next) => {
  try {
    const data = await financeProgramService.getAllPrograms();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const parseAmountWithUniqueCode = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const data = await financeProgramService.parseAmountWithUniqueCode(amount);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getProgramStatistics = async (req, res, next) => {
  try {
    const data = await financeProgramService.getProgramStatistics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const syncAllProgramsCollectedAmount = async (req, res, next) => {
  try {
    const data = await financeProgramService.syncAllProgramsCollectedAmount();
    res.json({ success: true, message: 'Sinkronisasi berhasil.', data });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BANK IMPORTS ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const importBankCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('File CSV harus diupload.');
      err.statusCode = 400;
      throw err;
    }

    const { accountId, bankFormat = 'STANDARD' } = req.body;
    const userId = req.user?.id || null;

    const result = await financeBankService.importBankCSV({
      accountId,
      filePath: req.file.path,
      fileName: req.file.originalname,
      bankFormat,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Import berhasil.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getAllBankImports = async (req, res, next) => {
  try {
    const result = await financeBankService.getAllBankImports(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getBankImportDetails = async (req, res, next) => {
  try {
    const result = await financeBankService.getBankImportDetails(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const deleteBankImport = async (req, res, next) => {
  try {
    await financeBankService.deleteBankImport(req.params.id);
    res.json({ success: true, message: 'Import berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

const confirmBankImport = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const data = await financeBankService.confirmBankImport(req.params.id, userId);
    res.json({ success: true, message: 'Import berhasil dikonfirmasi dan transaksi dibuat.', data });
  } catch (err) {
    next(err);
  }
};

const getUnmatchedBankTransactions = async (req, res, next) => {
  try {
    const { accountId } = req.query;
    const data = await financeBankService.getUnmatchedBankTransactions(accountId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RECONCILIATION ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const autoMatch = async (req, res, next) => {
  try {
    const { accountId, dateTolerance, autoCreate } = req.body;
    const result = await financeReconciliationService.autoMatch(accountId, {
      dateTolerance: dateTolerance || 1,
      autoCreate: autoCreate || false,
    });
    res.json({ success: true, message: 'Auto-match selesai.', data: result });
  } catch (err) {
    next(err);
  }
};

const manualMatch = async (req, res, next) => {
  try {
    const { bankImportDetailId, transactionId } = req.body;
    const userId = req.user?.id || null;
    const data = await financeReconciliationService.manualMatch(
      bankImportDetailId,
      transactionId,
      userId
    );
    res.json({ success: true, message: 'Matching berhasil.', data });
  } catch (err) {
    next(err);
  }
};

const unmatch = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const data = await financeReconciliationService.unmatch(req.params.id, userId);
    res.json({ success: true, message: 'Unmatch berhasil.', data });
  } catch (err) {
    next(err);
  }
};

const markAsUnmatched = async (req, res, next) => {
  try {
    const { bankImportDetailId } = req.body;
    const userId = req.user?.id || null;
    const data = await financeReconciliationService.markAsUnmatched(bankImportDetailId, userId);
    res.json({ success: true, message: 'Berhasil ditandai sebagai unmatched.', data });
  } catch (err) {
    next(err);
  }
};

const getReconciliationSummary = async (req, res, next) => {
  try {
    const { accountId } = req.query;
    const data = await financeReconciliationService.getSummary(accountId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAllReconciliations = async (req, res, next) => {
  try {
    const result = await financeReconciliationService.getAllReconciliations(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const data = await financeReconciliationService.getSuggestions(req.params.bankImportDetailId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const assignProgram = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const data = await financeReconciliationService.assignProgram(
      req.params.id,
      req.body || {},
      userId
    );
    res.json({ success: true, message: 'Program berhasil diatur.', data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // Accounts
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAllAccountsWithBalance,

  // Transactions
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,

  // Export Transactions
  exportTransactionsExcel,
  exportTransactionsPDF,

  // Dashboard & Reports
  getDashboardSummary,
  getFundTracking,
  getMonthlyReport,
  exportMonthlyReportExcel,
  exportMonthlyReportPDF,

  // Programs
  getAllPrograms,
  parseAmountWithUniqueCode,
  getProgramStatistics,
  syncAllProgramsCollectedAmount,

  // Bank Imports
  importBankCSV,
  getAllBankImports,
  getBankImportDetails,
  deleteBankImport,
  confirmBankImport,
  getUnmatchedBankTransactions,

  // Reconciliation
  autoMatch,
  manualMatch,
  unmatch,
  markAsUnmatched,
  assignProgram,
  getReconciliationSummary,
  getAllReconciliations,
  getSuggestions,
};
