const prisma = require('../lib/prisma');
const submissionService = require('../services/finance-submission.service');

// ═══ REKENING (Pencairan) ═══════════════════════════════════════════════════════

const getSubmissionRekening = async (req, res, next) => {
  try {
    const data = await prisma.rekeningPencairan.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createSubmissionRekening = async (req, res, next) => {
  try {
    const { namaBank, noRekening, atasNama } = req.body;
    if (!namaBank || !noRekening || !atasNama) {
      return res.status(400).json({ success: false, message: 'Nama bank, nomor rekening, dan atas nama wajib diisi.' });
    }
    const data = await prisma.rekeningPencairan.create({
      data: { namaBank, noRekening, atasNama },
    });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// ═══ LIST & DETAIL ═════════════════════════════════════════════════════════════

const getAllSubmissions = async (req, res, next) => {
  try {
    const result = await submissionService.getAllSubmissions(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getSubmissionById = async (req, res, next) => {
  try {
    const data = await submissionService.getSubmissionById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ═══ CRUD ══════════════════════════════════════════════════════════════════════

const createSubmission = async (req, res, next) => {
  try {
    const data = await submissionService.createSubmission(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Pengajuan berhasil dibuat.', data });
  } catch (err) { next(err); }
};

const updateSubmission = async (req, res, next) => {
  try {
    const data = await submissionService.updateSubmission(req.params.id, req.body);
    res.json({ success: true, message: 'Pengajuan berhasil diubah.', data });
  } catch (err) { next(err); }
};

const deleteSubmission = async (req, res, next) => {
  try {
    await submissionService.deleteSubmission(req.params.id);
    res.json({ success: true, message: 'Pengajuan berhasil dihapus.' });
  } catch (err) { next(err); }
};

const submitSubmission = async (req, res, next) => {
  try {
    const data = await submissionService.submitSubmission(req.params.id, req.user.id);
    res.json({ success: true, message: 'Pengajuan berhasil diajukan.', data });
  } catch (err) { next(err); }
};

// ═══ APPROVAL ═══════════════════════════════════════════════════════════════════

const approveSubmission = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const data = await submissionService.approveSubmission(req.params.id, req.user.id, req.user.role, notes);
    res.json({ success: true, message: 'Pengajuan berhasil disetujui.', data });
  } catch (err) { next(err); }
};

const rejectSubmission = async (req, res, next) => {
  try {
    const { rejectionNote } = req.body;
    const data = await submissionService.rejectSubmission(req.params.id, req.user.id, req.user.role, rejectionNote);
    res.json({ success: true, message: 'Pengajuan berhasil ditolak.', data });
  } catch (err) { next(err); }
};

// ═══ DISBURSEMENT ═══════════════════════════════════════════════════════════════

const disburseSubmission = async (req, res, next) => {
  try {
    const { disbursementRef } = req.body;
    const buktiPencairan = req.file ? `/uploads/bukti_transfer/${req.file.filename}` : null;
    const data = await submissionService.disburseSubmission(req.params.id, req.user.id, req.user.role, disbursementRef, buktiPencairan);
    res.json({ success: true, message: 'Dana berhasil dicairkan.', data });
  } catch (err) { next(err); }
};

// ═══ SUMMARY ════════════════════════════════════════════════════════════════════

const getSubmissionSummary = async (req, res, next) => {
  try {
    const data = await submissionService.getSubmissionSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ═══ ITEM NAME SUGGESTIONS ══════════════════════════════════════════════════════

const getItemNameSuggestions = async (req, res, next) => {
  try {
    const data = await submissionService.getItemNameSuggestions();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ═══ PDF EXPORT ═════════════════════════════════════════════════════════════════

const exportSubmissionPDF = async (req, res, next) => {
  try {
    const submission = await submissionService.getSubmissionById(req.params.id);
    const buffer = await submissionService.generateSubmissionPDF(submission);
    const filename = 'Pengajuan-' + (submission.judul || 'Keuangan').replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buffer);
  } catch (err) { next(err); }
};

const exportSubmissionsListPDF = async (req, res, next) => {
  try {
    const { data } = await submissionService.getAllSubmissions({ ...req.query, limit: 10000 });
    const buffer = await submissionService.generateSubmissionsListPDF(data, req.query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan-Pengajuan-Keuangan.pdf"');
    res.send(buffer);
  } catch (err) { next(err); }
};

module.exports = {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  submitSubmission,
  approveSubmission,
  rejectSubmission,
  disburseSubmission,
  getSubmissionSummary,
  exportSubmissionPDF,
  exportSubmissionsListPDF,
  getSubmissionRekening,
  createSubmissionRekening,
  getItemNameSuggestions,
};
