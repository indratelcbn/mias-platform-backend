const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Simpan nama item ke tabel suggestion agar bisa dipakai auto-complete
 * pada pengajuan berikutnya. Menerima array item, meng-upsert nama unik.
 */
const saveItemNames = async (items = [], tx = prisma) => {
  const names = [...new Set(
    items
      .map((it) => (it.namaBarang || '').trim())
      .filter((n) => n.length > 0)
  )];
  if (names.length === 0) return;
  await Promise.all(
    names.map((nama) =>
      tx.submissionItemName.upsert({
        where: { nama },
        update: {},
        create: { nama },
      })
    )
  );
};

/**
 * Ambil daftar nama item untuk suggestion (auto-complete)
 */
const getItemNameSuggestions = async () => {
  const rows = await prisma.submissionItemName.findMany({
    orderBy: { nama: 'asc' },
    select: { nama: true },
  });
  return rows.map((r) => r.nama);
};

/**
 * Ambil daftar nama program milik Divisi Sosial (Infaq + Wakaf).
 * Dipakai sebagai pilihan Sub Judul pada Pengajuan Sosial.
 */
const getSosialPrograms = async () => {
  const divisiList = await prisma.divisi.findMany({
    where: { nama: { contains: 'sosial', mode: 'insensitive' } },
    include: {
      programDonasi: { orderBy: { urutan: 'asc' }, select: { judul: true, isActive: true } },
      programWakaf: { orderBy: { urutan: 'asc' }, select: { kegiatan: true, isActive: true } },
    },
  });

  const names = new Set();
  divisiList.forEach((divisi) => {
    divisi.programDonasi.forEach((p) => {
      if (p.judul) names.add(p.judul.trim());
    });
    divisi.programWakaf.forEach((p) => {
      if (p.kegiatan) names.add(p.kegiatan.trim());
    });
  });

  return Array.from(names).sort((a, b) => a.localeCompare(b, 'id'));
};

/**
 * Normalisasi items dari payload menjadi bentuk siap simpan.
 * Mendukung field subJudul (untuk jenis KAJIAN) dan urutan.
 */
const normalizeItems = (items = []) => {
  let totalAmount = 0;
  const submissionItems = items.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const hargaSatuan = Number(item.hargaSatuan) || 0;
    const jumlah = qty * hargaSatuan;
    totalAmount += jumlah;
    return {
      subJudul: item.subJudul ? String(item.subJudul).trim() || null : null,
      subTanggal: item.subTanggal ? String(item.subTanggal).trim() || null : null,
      subHari: item.subHari ? String(item.subHari).trim() || null : null,
      subWaktu: item.subWaktu ? String(item.subWaktu).trim() || null : null,
      namaBarang: item.namaBarang,
      qty,
      hargaSatuan,
      jumlah,
      keterangan: item.keterangan || null,
      urutan: Number(item.urutan) >= 0 ? Number(item.urutan) : idx,
    };
  });
  return { submissionItems, totalAmount };
};

const LOGO_MIAS = path.join(__dirname, '../assets/logo-mias.png');
const LOGO_MIAS_TV = path.join(__dirname, '../assets/logo-mias-tv.png');

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
        items: { orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }] },
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
      items: { orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }] },
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
  const { jenis, judul, deskripsi, notes, attachment, metodePencairan, rekeningId, items } = data;

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

  const jenisPengajuan = ['KAJIAN', 'SOSIAL'].includes(jenis) ? jenis : 'UMUM';
  const { submissionItems, totalAmount } = normalizeItems(items);

  const nomor = await generateNomor();

  const submission = await prisma.submission.create({
    data: {
      nomor,
      jenis: jenisPengajuan,
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
      items: { orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  // Simpan nama item untuk suggestion (jangan gagalkan pembuatan jika error)
  saveItemNames(items).catch(() => {});

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

  const { jenis, judul, deskripsi, notes, attachment, metodePencairan, rekeningId, items } = data;
  const updateData = {};

  if (jenis !== undefined) updateData.jenis = ['KAJIAN', 'SOSIAL'].includes(jenis) ? jenis : 'UMUM';
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
    const { submissionItems, totalAmount } = normalizeItems(items);
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
          items: { orderBy: [{ urutan: 'asc' }, { createdAt: 'asc' }] },
        },
      });
    });

    // Simpan nama item untuk suggestion
    saveItemNames(items).catch(() => {});

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

    const pageWidth = doc.page.width;

    // ── Logo Header ──
    try { doc.image(LOGO_MIAS, 50, 40, { width: 60 }); } catch (e) { /* skip */ }
    try { doc.image(LOGO_MIAS_TV, pageWidth - 110, 55, { width: 60 }); } catch (e) { /* skip */ }

    // ── Judul Dokumen ──
    doc.fontSize(16).font('Helvetica-Bold').text('PENGAJUAN KEUANGAN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').text('Masjid Imam Asy Syafi\'i Depok', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text('No: ' + (submission.nomor || '-'), { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1B7A4A');
    doc.moveDown(0.8);

    // ── Info utama ──
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

    // ── Tabel Item ──
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('Rincian Item Pengajuan');
    doc.moveDown(0.3);

    const tTop = doc.y;
    const c1 = 50, c2 = 90, c3 = 230, c4 = 300, c5 = 400;

    doc.rect(50, tTop, 495, 20).fill('#1B7A4A');
    doc.fill('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('No', c1, tTop + 5, { width: 30, align: 'center' });
    doc.text('Nama Item', c2, tTop + 5, { width: 130 });
    doc.text('Qty', c3, tTop + 5, { width: 40, align: 'center' });
    doc.text('Harga', c4, tTop + 5, { width: 90, align: 'right' });
    doc.text('Jumlah', c5, tTop + 5, { width: 95, align: 'right' });

    doc.fill('#000000').font('Helvetica');
    let y = tTop + 22;
    const items = submission.items || [];
    const isGrouped = ['KAJIAN', 'SOSIAL'].includes(submission.jenis);

    if (items.length === 0) {
      doc.text('Tidak ada item', c1, y);
      y += 18;
    } else if (isGrouped) {
      // Kelompokkan berdasarkan sub judul
      const groups = [];
      const groupMap = new Map();
      items.forEach((item) => {
        const key = item.subJudul || 'Lainnya';
        if (!groupMap.has(key)) {
          const g = { subJudul: key, subTanggal: item.subTanggal || null, subHari: item.subHari || null, subWaktu: item.subWaktu || null, items: [] };
          groupMap.set(key, g);
          groups.push(g);
        }
        groupMap.get(key).items.push(item);
      });

      let no = 1;
      groups.forEach((g, gi) => {
        if (y > 720) { doc.addPage(); y = 50; }
        // Jarak antar sub judul
        if (gi > 0) y += 12;
        // Baris sub judul
        doc.fill('#1B7A4A').font('Helvetica-Bold').fontSize(10);
        let subHeader = g.subJudul;
        const jadwal = [];
        if (g.subTanggal) jadwal.push((g.subHari ? g.subHari + ', ' : '') + formatDate(g.subTanggal));
        if (g.subWaktu) jadwal.push(g.subWaktu);
        if (jadwal.length) subHeader += '  (' + jadwal.join(' — ') + ')';
        const subH = Math.max(18, doc.heightOfString(subHeader, { width: 470 }) + 6);
        doc.rect(50, y - 2, 495, subH).fill('#E8F5E9');
        doc.fill('#1B7A4A').text(subHeader, c1 + 5, y, { width: 470 });
        y += subH;
        doc.fill('#000000').font('Helvetica');
        g.items.forEach((item) => {
          const nama = item.namaBarang || '-';
          const rowH = Math.max(18, doc.heightOfString(nama, { width: 130 }) + 6);
          if (y + rowH > 790) { doc.addPage(); y = 50; }
          doc.fill('#000000');
          doc.text(String(no), c1, y, { width: 30, align: 'center' });
          doc.text(nama, c2, y, { width: 130 });
          doc.text(String(item.qty), c3, y, { width: 40, align: 'center' });
          doc.text(formatRupiah(item.hargaSatuan), c4, y, { width: 90, align: 'right' });
          doc.text(formatRupiah(item.jumlah), c5, y, { width: 95, align: 'right' });
          y += rowH;
          no += 1;
        });
      });
    } else {
      items.forEach((item, i) => {
        const nama = item.namaBarang || '-';
        const rowH = Math.max(18, doc.heightOfString(nama, { width: 130 }) + 6);
        if (y + rowH > 790) { doc.addPage(); y = 50; }
        doc.fill('#000000');
        doc.text(String(i + 1), c1, y, { width: 30, align: 'center' });
        doc.text(nama, c2, y, { width: 130 });
        doc.text(String(item.qty), c3, y, { width: 40, align: 'center' });
        doc.text(formatRupiah(item.hargaSatuan), c4, y, { width: 90, align: 'right' });
        doc.text(formatRupiah(item.jumlah), c5, y, { width: 95, align: 'right' });
        y += rowH;
      });
    }

    doc.moveTo(50, y).lineTo(545, y).stroke('#1B7A4A');
    y += 5;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL', 300, y, { width: 90, align: 'right' });
    doc.text(formatRupiah(submission.amount), c5, y, { width: 95, align: 'right' });

    if (submission.notes) {
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Bold').text('Catatan:');
      doc.font('Helvetica').text(submission.notes);
    }

    // ── Stempel DISETUJUI ──
    if (submission.status === 'APPROVED' || submission.status === 'REJECTED') {
      const stampX = 350, stampY = y + 30;
      const stampColor = submission.status === 'APPROVED' ? '#1B7A4A' : '#D32F2F';
      const stampText = submission.status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK';

      doc.save();
      doc.translate(stampX + 60, stampY + 25);
      doc.rotate(-15);
      doc.roundedRect(-60, -25, 120, 50, 8).lineWidth(3).stroke(stampColor);
      doc.fill(stampColor).fontSize(18).font('Helvetica-Bold').text(stampText, -55, -12, { width: 110, align: 'center' });
      doc.restore();

      // Ensure doc.y is below the stamp before signature section
      doc.y = Math.max(doc.y, stampY + 80);
    }

    // ── Tanda Tangan + Footer ──
    const leftX = 80;
    const rightX = 370;
    const sigWidth = 150;
    const footerHeight = 26;
    const signatureHeight = 135;
    const blockGap = 24;
    const pageBottom = doc.page.height - doc.page.margins.bottom;

    let blockStartY = Math.max(doc.y, y + 40);
    const blockEndY = blockStartY + signatureHeight + blockGap + footerHeight;

    if (blockEndY > pageBottom) {
      doc.addPage();
      blockStartY = doc.page.margins.top + 40;
    }

    const sigY = blockStartY;

    doc.fill('#000000').fontSize(10).font('Helvetica').text('Mengetahui,', leftX, sigY, { width: sigWidth });

    // Ketua DKM
    doc.font('Helvetica-Bold').text('Ketua DKM', leftX, sigY + 60, { width: sigWidth, align: 'center' });
    doc.moveTo(leftX, sigY + 110).lineTo(leftX + sigWidth, sigY + 110).stroke('#999');
    doc.font('Helvetica').fontSize(9).text('(                                )', leftX, sigY + 115, { width: sigWidth, align: 'center' });

    // Wakil Ketua DKM
    doc.fontSize(10).font('Helvetica-Bold').text('Wakil Ketua DKM', rightX, sigY + 60, { width: sigWidth, align: 'center' });
    doc.moveTo(rightX, sigY + 110).lineTo(rightX + sigWidth, sigY + 110).stroke('#999');
    doc.font('Helvetica').fontSize(9).text('(                                )', rightX, sigY + 115, { width: sigWidth, align: 'center' });

    // ── Footer ──
    const footerY = Math.min(sigY + signatureHeight + blockGap, pageBottom - footerHeight);
    doc.fontSize(9).font('Helvetica').fill('#888888');
    doc.text('Dokumen ini dibuat otomatis oleh sistem MIAS.', 50, footerY, { width: 495, align: 'center' });
    doc.text('Tanggal cetak: ' + formatDate(new Date()), 50, footerY + 12, { width: 495, align: 'center' });

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
    const listPageWidth = doc.page.width;
    try { doc.image(LOGO_MIAS, 40, 30, { width: 50 }); } catch (e) { /* skip */ }
    try { doc.image(LOGO_MIAS_TV, listPageWidth - 90, 30, { width: 50 }); } catch (e) { /* skip */ }

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
  getItemNameSuggestions,
  getSosialPrograms,
  generateSubmissionPDF,
  generateSubmissionsListPDF,
};
