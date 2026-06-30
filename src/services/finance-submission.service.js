const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const generateNomor = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const count = await prisma.submission.count({
    where: {
      createdAt: { gte: monthStart, lt: monthEnd },
    },
  });

  const seq = String(count + 1).padStart(3, '0');
  return `${seq}/${ROMAN_MONTHS[month]}/${year}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SUBMISSION MANAGEMENT (Pengajuan Keuangan) ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all submissions with optional filtering & pagination
 */
const getAllSubmissions = async ({ page = 1, limit = 20, status, submittedBy } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};
  if (status) where.status = status;
  if (submittedBy) where.submittedById = submittedBy;

  const [data, total] = await Promise.all([
    prisma.submission.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, nama: true, role: true } },
        approvedBy:  { select: { id: true, nama: true, role: true } },
        rejectedBy:  { select: { id: true, nama: true, role: true } },
        disbursedBy: { select: { id: true, nama: true, role: true } },
        rekening: true,
        items: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  };
};

/**
 * Get submission by ID with all relations
 */
const getSubmissionById = async (id) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, nama: true, role: true } },
      approvedBy:  { select: { id: true, nama: true, role: true } },
      rejectedBy:  { select: { id: true, nama: true, role: true } },
      disbursedBy: { select: { id: true, nama: true, role: true } },
      rekening: true,
      items: { orderBy: { createdAt: 'asc' } },
      approvalLogs: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, nama: true, role: true } } },
      },
    },
  });

  if (!submission) {
    const err = new Error('Pengajuan tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return submission;
};

/**
 * Create a new submission with items (status: DRAFT)
 * Body: { judul, deskripsi, notes, attachment, metodePencairan, rekeningId, items: [{ namaBarang, qty, hargaSatuan }] }
 * Total amount dihitung otomatis dari items
 */
const createSubmission = async (data, userId) => {
  const { judul, deskripsi, notes, attachment, metodePencairan, rekeningId, items } = data;

  if (!judul) {
    const err = new Error('Judul wajib diisi.');
    err.statusCode = 400;
    throw err;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Minimal satu item pengajuan diperlukan.');
    err.statusCode = 400;
    throw err;
  }

  // Hitung total amount dari items
  let totalAmount = 0;
  const submissionItems = items.map(item => {
    const qty = Number(item.qty) || 1;
    const hargaSatuan = Number(item.hargaSatuan) || 0;
    const jumlah = qty * hargaSatuan;
    totalAmount += jumlah;
    return {
      namaBarang: item.namaBarang,
      qty,
      hargaSatuan,
      jumlah,
      keterangan: item.keterangan || null,
    };
  });

  const nomor = await generateNomor();

  const submission = await prisma.submission.create({
    data: {
      nomor,
      judul,
      deskripsi: deskripsi || null,
      amount: new Prisma.Decimal(totalAmount),
      status: 'DRAFT',
      submittedById: userId,
      notes: notes || null,
      attachment: attachment || null,
      metodePencairan: metodePencairan || null,
      rekeningId: metodePencairan === 'TRANSFER' ? rekeningId || null : null,
      items: { create: submissionItems },
    },
    include: {
      submittedBy: { select: { id: true, nama: true, role: true } },
      items: true,
    },
  });

  return submission;
};

/**
 * Update a submission (only if DRAFT status)
 */
const updateSubmission = async (id, data) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'DRAFT') {
    const err = new Error('Hanya pengajuan dengan status DRAFT yang dapat diubah.');
    err.statusCode = 400;
    throw err;
  }

  const { judul, deskripsi, notes, attachment, metodePencairan, rekeningId, items } = data;
  const updateData = {};

  if (judul !== undefined) updateData.judul = judul;
  if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
  if (notes !== undefined) updateData.notes = notes;
  if (attachment !== undefined) updateData.attachment = attachment;
  if (metodePencairan !== undefined) {
    updateData.metodePencairan = metodePencairan;
    updateData.rekeningId = metodePencairan === 'TRANSFER' ? rekeningId || null : null;
  }

  // Jika items dikirim, replace semua items dan hitung ulang total
  if (items && Array.isArray(items)) {
    let totalAmount = 0;
    const submissionItems = items.map(item => {
      const qty = Number(item.qty) || 1;
      const hargaSatuan = Number(item.hargaSatuan) || 0;
      const jumlah = qty * hargaSatuan;
      totalAmount += jumlah;
      return {
        namaBarang: item.namaBarang,
        qty,
        hargaSatuan,
        jumlah,
        keterangan: item.keterangan || null,
      };
    });
    updateData.amount = new Prisma.Decimal(totalAmount);

    // Hapus items lama, buat baru dalam transaksi
    const submission = await prisma.$transaction(async (tx) => {
      await tx.submissionItem.deleteMany({ where: { submissionId: id } });
      return tx.submission.update({
        where: { id },
        data: {
          ...updateData,
          items: { create: submissionItems },
        },
        include: {
          submittedBy: { select: { id: true, nama: true, role: true } },
          items: true,
        },
      });
    });
    return submission;
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: updateData,
    include: {
      submittedBy: { select: { id: true, nama: true, role: true } },
      items: { orderBy: { createdAt: 'asc' } },
    },
  });

  return submission;
};

/**
 * Delete a submission (only if DRAFT status)
 */
const deleteSubmission = async (id) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'DRAFT') {
    const err = new Error('Hanya pengajuan dengan status DRAFT yang dapat dihapus.');
    err.statusCode = 400;
    throw err;
  }

  // Cascade delete items & logs handled by schema
  await prisma.submission.delete({ where: { id } });
  return true;
};

/**
 * Submit a draft for approval → status SUBMITTED
 */
const submitSubmission = async (id, userId) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'DRAFT') {
    const err = new Error('Hanya pengajuan dengan status DRAFT yang dapat diajukan.');
    err.statusCode = 400;
    throw err;
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: { status: 'SUBMITTED' },
    include: {
      submittedBy: { select: { id: true, nama: true, role: true } },
      items: { orderBy: { createdAt: 'asc' } },
    },
  });

  return submission;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── APPROVAL FLOW ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_APPROVER_ROLES = ['VIEWER', 'KETUA_DKM', 'WAKIL_DKM', 'SUPERADMIN', 'ADMIN'];

/**
 * Approve a submission → status APPROVED
 * Ketua DKM atau Wakil DKM (atau SUPERADMIN/ADMIN) — cukup salah satu
 */
const approveSubmission = async (id, userId, userRole, notes) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'SUBMITTED') {
    const err = new Error('Hanya pengajuan dengan status SUBMITTED yang dapat disetujui.');
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_APPROVER_ROLES.includes(userRole)) {
    const err = new Error('Anda tidak memiliki izin untuk menyetujui pengajuan.');
    err.statusCode = 403;
    throw err;
  }

  const [submission] = await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        submittedBy: { select: { id: true, nama: true, role: true } },
        approvedBy:  { select: { id: true, nama: true, role: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.submissionApprovalLog.create({
      data: {
        submissionId: id,
        userId,
        action: 'APPROVED',
        notes: notes || null,
      },
    }),
  ]);

  return submission;
};

/**
 * Reject a submission → status REJECTED
 */
const rejectSubmission = async (id, userId, userRole, rejectionNote) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'SUBMITTED') {
    const err = new Error('Hanya pengajuan dengan status SUBMITTED yang dapat ditolak.');
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_APPROVER_ROLES.includes(userRole)) {
    const err = new Error('Anda tidak memiliki izin untuk menolak pengajuan.');
    err.statusCode = 403;
    throw err;
  }

  const [submission] = await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionNote: rejectionNote || null,
      },
      include: {
        submittedBy: { select: { id: true, nama: true, role: true } },
        rejectedBy:  { select: { id: true, nama: true, role: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.submissionApprovalLog.create({
      data: {
        submissionId: id,
        userId,
        action: 'REJECTED',
        notes: rejectionNote || null,
      },
    }),
  ]);

  return submission;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DISBURSEMENT (Pencairan oleh Bendahara) ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_DISBURSER_ROLES = ['KEUANGAN', 'SUPERADMIN', 'ADMIN'];

/**
 * Mark submission as disbursed (pencairan dana)
 * Hanya role KEUANGAN (Bendahara) atau SUPERADMIN
 */
const disburseSubmission = async (id, userId, userRole, disbursementRef, buktiPencairan = null) => {
  const existing = await getSubmissionById(id);

  if (existing.status !== 'APPROVED') {
    const err = new Error('Hanya pengajuan dengan status APPROVED yang dapat dicairkan.');
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_DISBURSER_ROLES.includes(userRole)) {
    const err = new Error('Hanya Bendahara (KEUANGAN) atau SUPERADMIN yang dapat mencairkan dana.');
    err.statusCode = 403;
    throw err;
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: {
      disbursedById: userId,
      disbursedAt: new Date(),
      disbursementRef: disbursementRef || null,
      buktiPencairan: buktiPencairan,
    },
    include: {
      submittedBy: { select: { id: true, nama: true, role: true } },
      approvedBy:  { select: { id: true, nama: true, role: true } },
      disbursedBy: { select: { id: true, nama: true, role: true } },
      items: { orderBy: { createdAt: 'asc' } },
    },
  });

  return submission;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SUMMARY / STATISTICS ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const getSubmissionSummary = async () => {
  const [draft, submitted, approved, rejected, total] = await Promise.all([
    prisma.submission.count({ where: { status: 'DRAFT' } }),
    prisma.submission.count({ where: { status: 'SUBMITTED' } }),
    prisma.submission.count({ where: { status: 'APPROVED' } }),
    prisma.submission.count({ where: { status: 'REJECTED' } }),
    prisma.submission.count(),
  ]);

  const [draftAmount, submittedAmount, approvedAmount, rejectedAmount] = await Promise.all([
    prisma.submission.aggregate({ where: { status: 'DRAFT' }, _sum: { amount: true } }),
    prisma.submission.aggregate({ where: { status: 'SUBMITTED' }, _sum: { amount: true } }),
    prisma.submission.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
    prisma.submission.aggregate({ where: { status: 'REJECTED' }, _sum: { amount: true } }),
  ]);

  return {
    counts: { draft, submitted, approved, rejected, total },
    amounts: {
      draft: draftAmount._sum.amount || 0,
      submitted: submittedAmount._sum.amount || 0,
      approved: approvedAmount._sum.amount || 0,
      rejected: rejectedAmount._sum.amount || 0,
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PDF EXPORT ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const formatRupiah = (val) => {
  const n = Number(val) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const statusLabel = (s) => {
  const m = { DRAFT: 'Draft', SUBMITTED: 'Menunggu Persetujuan', APPROVED: 'Disetujui', REJECTED: 'Ditolak' };
  return m[s] || s;
};

/**
 * Generate PDF for a single submission
 */
const generateSubmissionPDF = (submission) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('PENGAJUAN KEUANGAN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').text('Masjid Imam Asy Syafi\'i Depok', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text('No: ' + (submission.nomor || '-'), { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1B7A4A');
    doc.moveDown(0.8);

    // Info utama
    doc.fontSize(11).font('Helvetica-Bold').text('Informasi Pengajuan');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const rows = [
      ['Nomor', submission.nomor || '-'],
      ['Judul', submission.judul || '-'],
      ['Status', statusLabel(submission.status)],
      ['Tanggal Dibuat', formatDate(submission.createdAt)],
      ['Diajukan Oleh', submission.submittedBy?.nama || '-'],
    ];

    if (submission.approvedBy) {
      rows.push(['Disetujui Oleh', submission.approvedBy.nama]);
      rows.push(['Tanggal Disetujui', formatDate(submission.approvedAt)]);
    }
    if (submission.rejectedBy) {
      rows.push(['Ditolak Oleh', submission.rejectedBy.nama]);
      rows.push(['Tanggal Ditolak', formatDate(submission.rejectedAt)]);
      rows.push(['Alasan Penolakan', submission.rejectionNote || '-']);
    }
    if (submission.disbursedBy) {
      rows.push(['Dicairkan Oleh', submission.disbursedBy.nama]);
      rows.push(['Tanggal Pencairan', formatDate(submission.disbursedAt)]);
    }

    rows.forEach(([l, v]) => doc.text(l + ': ' + v));

    if (submission.deskripsi) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Deskripsi:');
      doc.font('Helvetica').text(submission.deskripsi);
    }

    // Tabel Item
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('Rincian Item Pengajuan');
    doc.moveDown(0.3);

    const tTop = doc.y;
    const c1 = 50, c2 = 230, c3 = 310, c4 = 390, c5 = 470;

    // Header row
    doc.rect(50, tTop, 495, 20).fill('#1B7A4A');
    doc.fill('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('No', c1, tTop + 5, { width: 40 });
    doc.text('Nama Item', c2, tTop + 5, { width: 80 });
    doc.text('Qty', c3, tTop + 5, { width: 50, align: 'center' });
    doc.text('Harga Satuan', c4, tTop + 5, { width: 80, align: 'right' });
    doc.text('Jumlah', c5, tTop + 5, { width: 75, align: 'right' });

    doc.fill('#000000').font('Helvetica');
    let y = tTop + 22;
    const items = submission.items || [];

    if (items.length === 0) {
      doc.text('Tidak ada item', c1, y);
      y += 18;
    } else {
      items.forEach((item, i) => {
        if (i % 2 === 0) doc.rect(50, y - 2, 495, 18).fill('#F5F5F5');
        doc.fill('#000000');
        doc.text(String(i + 1), c1, y, { width: 40 });
        doc.text(item.namaBarang || '-', c2, y, { width: 80 });
        doc.text(String(item.qty), c3, y, { width: 50, align: 'center' });
        doc.text(formatRupiah(item.hargaSatuan), c4, y, { width: 80, align: 'right' });
        doc.text(formatRupiah(item.jumlah), c5, y, { width: 75, align: 'right' });
        y += 18;
      });
    }

    // Total
    doc.moveTo(50, y).lineTo(545, y).stroke('#1B7A4A');
    y += 5;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL', c3, y, { width: 80, align: 'right' });
    doc.text(formatRupiah(submission.amount), c5, y, { width: 75, align: 'right' });

    if (submission.notes) {
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Bold').text('Catatan:');
      doc.font('Helvetica').text(submission.notes);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').fill('#888888');
    doc.text('Dokumen ini dibuat otomatis oleh sistem MIAS.', { align: 'center' });
    doc.text('Tanggal cetak: ' + formatDate(new Date()), { align: 'center' });

    doc.end();
  });
};

/**
 * Generate PDF report for a list of submissions
 */
const generateSubmissionsListPDF = (submissions, filters = {}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(14).font('Helvetica-Bold').text('LAPORAN PENGAJUAN KEUANGAN', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Masjid Imam Asy Syafi\'i Depok', { align: 'center' });
    doc.moveDown(0.3);

    // Filter info
    doc.fontSize(9).fill('#666666');
    let ft = '';
    if (filters.status) ft += 'Status: ' + statusLabel(filters.status) + ' | ';
    ft += 'Tanggal: ' + formatDate(new Date());
    doc.text(ft, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#1B7A4A');
    doc.moveDown(0.5);

    // Table
    const cols = { no: 40, judul: 85, pemohon: 210, amount: 340, status: 425, tgl: 480 };
    const tTop = doc.y;

    doc.rect(40, tTop, 515, 18).fill('#1B7A4A');
    doc.fill('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('Nomor', cols.no, tTop + 4);
    doc.text('Judul', cols.judul, tTop + 4, { width: cols.pemohon - cols.judul - 5 });
    doc.text('Pemohon', cols.pemohon, tTop + 4, { width: cols.amount - cols.pemohon - 5 });
    doc.text('Jumlah', cols.amount, tTop + 4, { width: cols.status - cols.amount - 5, align: 'right' });
    doc.text('Status', cols.status, tTop + 4, { width: cols.tgl - cols.status - 5 });
    doc.text('Tanggal', cols.tgl, tTop + 4, { width: 555 - cols.tgl - 5 });
    doc.font('Helvetica').fill('#000000');

    let yPos = tTop + 20;
    let totalAmt = 0;

    submissions.forEach((sub, i) => {
      if (yPos > 770) { doc.addPage(); yPos = 40; }
      if (i % 2 === 0) doc.rect(40, yPos - 1, 515, 16).fill('#F9F9F9');
      doc.fill('#000000').fontSize(8);
      doc.text(sub.nomor || '-', cols.no, yPos);
      doc.text((sub.judul || '-').substring(0, 35), cols.judul, yPos, { width: cols.pemohon - cols.judul - 5 });
      doc.text(sub.submittedBy?.nama || '-', cols.pemohon, yPos, { width: cols.amount - cols.pemohon - 5 });
      doc.text(formatRupiah(sub.amount), cols.amount, yPos, { width: cols.status - cols.amount - 5, align: 'right' });
      doc.text(statusLabel(sub.status), cols.status, yPos, { width: cols.tgl - cols.status - 5 });
      doc.text(formatDate(sub.createdAt), cols.tgl, yPos, { width: 555 - cols.tgl - 5 });
      yPos += 16;
      totalAmt += Number(sub.amount) || 0;
    });

    // Total row
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke('#1B7A4A');
    yPos += 4;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total: ' + formatRupiah(totalAmt), { align: 'right' });

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fill('#888888');
    doc.text('Dokumen ini dibuat otomatis oleh sistem MIAS — ' + formatDate(new Date()), { align: 'center' });

    doc.end();
  });
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
  generateSubmissionPDF,
  generateSubmissionsListPDF,
};
