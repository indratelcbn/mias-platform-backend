const prisma = require('../lib/prisma');

const getAll = async ({ page = 1, limit = 10, status } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.donasi.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.donasi.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => {
  return prisma.donasi.create({
    data: {
      nama: data.nama,
      email: data.email || null,
      telepon: data.telepon || null,
      jenisProgram: data.jenisProgram || null,
      namaProgram: data.namaProgram || null,
      jumlah: data.jumlah,
      pesan: data.pesan || null,
      buktiTransfer: data.buktiTransfer || null,
    },
  });
};

const updateStatus = async (id, status) => {
  const donasi = await prisma.donasi.findUnique({ where: { id } });
  if (!donasi) {
    const err = new Error('Data infaq tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.donasi.update({ where: { id }, data: { status } });

  // Recalculate terkumpul for all programs
  await recalcAllTerkumpul();

  return updated;
};

/**
 * Recalculate terkumpul for ALL programs (infaq + wakaf)
 * by aggregating VERIFIED donations grouped by jenisProgram + namaProgram.
 */
const recalcAllTerkumpul = async () => {
  // Get all VERIFIED donations that have a program assigned
  const verifiedDonations = await prisma.donasi.findMany({
    where: { status: 'VERIFIED', namaProgram: { not: null } },
    select: { jenisProgram: true, namaProgram: true, jumlah: true },
  });

  // Build a map: { "DONASI|[KODE] Judul": totalAmount, "WAKAF|[KODE] Kegiatan": totalAmount }
  const totalsMap = {};
  for (const d of verifiedDonations) {
    const key = `${d.jenisProgram}|${d.namaProgram}`;
    totalsMap[key] = (totalsMap[key] || 0) + Number(d.jumlah);
  }

  // Build label lookup for Program Donasi
  const allDonasi = await prisma.programDonasi.findMany();
  for (const p of allDonasi) {
    const label = p.kode ? `[${p.kode}] ${p.judul}` : p.judul;
    const key = `DONASI|${label}`;
    const terkumpul = totalsMap[key] || 0;
    if (Number(p.terkumpul) !== terkumpul) {
      await prisma.programDonasi.update({
        where: { id: p.id },
        data: { terkumpul },
      });
    }
  }

  // Build label lookup for Program Wakaf
  const allWakaf = await prisma.programWakaf.findMany();
  for (const p of allWakaf) {
    const label = p.kode ? `[${p.kode}] ${p.kegiatan}` : p.kegiatan;
    const key = `WAKAF|${label}`;
    const terkumpul = totalsMap[key] || 0;
    if (Number(p.terkumpul) !== terkumpul) {
      await prisma.programWakaf.update({
        where: { id: p.id },
        data: { terkumpul },
      });
    }
  }
};

const getSummary = async () => {
  const [total, verified, pending] = await Promise.all([
    prisma.donasi.aggregate({ _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { status: 'VERIFIED' }, _sum: { jumlah: true } }),
    prisma.donasi.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalInfaq: total._sum.jumlah || 0,
    terverifikasi: verified._sum.jumlah || 0,
    pendingKonfirmasi: pending,
  };
};

const getRekening = async () => {
  return prisma.rekening.findMany({ orderBy: { createdAt: 'asc' } });
};

const createRekening = async (data) => {
  return prisma.rekening.create({
    data: {
      namaBank: data.namaBank,
      noRekening: data.noRekening,
      atasNama: data.atasNama,
      keterangan: data.keterangan || null,
      qrisImage: data.qrisImage || null,
      isActive: data.isActive !== undefined ? (data.isActive === 'true' || data.isActive === true) : true,
    },
  });
};

const updateRekening = async (id, data) => {
  const rek = await prisma.rekening.findUnique({ where: { id } });
  if (!rek) { const e = new Error('Rekening tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.rekening.update({
    where: { id },
    data: {
      namaBank: data.namaBank ?? rek.namaBank,
      noRekening: data.noRekening ?? rek.noRekening,
      atasNama: data.atasNama ?? rek.atasNama,
      keterangan: data.keterangan !== undefined ? data.keterangan : rek.keterangan,
      qrisImage: data.qrisImage !== undefined ? data.qrisImage : rek.qrisImage,
      isActive: data.isActive !== undefined ? (data.isActive === 'true' || data.isActive === true) : rek.isActive,
    },
  });
};

const deleteRekening = async (id) => {
  const rek = await prisma.rekening.findUnique({ where: { id } });
  if (!rek) { const e = new Error('Rekening tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.rekening.delete({ where: { id } });
};

// ─── Program Donasi ───────────────────────────────────────────────────────────
const getAllProgram = async () => {
  return prisma.programDonasi.findMany({ orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }] });
};

const getActiveProgram = async () => {
  return prisma.programDonasi.findMany({
    where: { isActive: true, tampilWebsite: true },
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const createProgram = async (data) => {
  return prisma.programDonasi.create({
    data: {
      kode: data.kode || null,
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      divisi: data.divisi || null,
      target: data.target ? parseFloat(data.target) : 0,
      terkumpul: data.terkumpul ? parseFloat(data.terkumpul) : 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      tampilWebsite: data.tampilWebsite !== undefined ? Boolean(data.tampilWebsite) : true,
      urutan: parseInt(data.urutan || 0),
    },
  });
};

const updateProgram = async (id, data) => {
  const prog = await prisma.programDonasi.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program infaq tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programDonasi.update({
    where: { id },
    data: {
      kode: data.kode !== undefined ? (data.kode || null) : undefined,
      judul: data.judul,
      deskripsi: data.deskripsi ?? prog.deskripsi,
      divisi: data.divisi !== undefined ? (data.divisi || null) : undefined,
      target: data.target !== undefined ? parseFloat(data.target) : undefined,
      terkumpul: data.terkumpul !== undefined ? parseFloat(data.terkumpul) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      tampilWebsite: data.tampilWebsite !== undefined ? Boolean(data.tampilWebsite) : undefined,
      urutan: data.urutan !== undefined ? parseInt(data.urutan) : undefined,
    },
  });
};

const deleteProgram = async (id) => {
  const prog = await prisma.programDonasi.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program infaq tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programDonasi.delete({ where: { id } });
};

// ─── Program Wakaf ────────────────────────────────────────────────────────────
const getAllWakaf = async () => {
  return prisma.programWakaf.findMany({ orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }] });
};

const getActiveWakaf = async () => {
  return prisma.programWakaf.findMany({
    where: { isActive: true, tampilWebsite: true },
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const createWakaf = async (data) => {
  return prisma.programWakaf.create({
    data: {
      kode: data.kode || null,
      kegiatan: data.kegiatan,
      deskripsi: data.deskripsi || null,
      divisi: data.divisi || null,
      target: data.target ? parseFloat(data.target) : 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      tampilWebsite: data.tampilWebsite !== undefined ? Boolean(data.tampilWebsite) : true,
      urutan: parseInt(data.urutan || 0),
    },
  });
};

const updateWakaf = async (id, data) => {
  const prog = await prisma.programWakaf.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program wakaf tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programWakaf.update({
    where: { id },
    data: {
      kode: data.kode !== undefined ? (data.kode || null) : undefined,
      kegiatan: data.kegiatan !== undefined ? data.kegiatan : undefined,
      deskripsi: data.deskripsi !== undefined ? (data.deskripsi || null) : undefined,
      divisi: data.divisi !== undefined ? (data.divisi || null) : undefined,
      target: data.target !== undefined ? (data.target ? parseFloat(data.target) : 0) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      tampilWebsite: data.tampilWebsite !== undefined ? Boolean(data.tampilWebsite) : undefined,
      urutan: data.urutan !== undefined ? parseInt(data.urutan) : undefined,
    },
  });
};

const deleteWakaf = async (id) => {
  const prog = await prisma.programWakaf.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program wakaf tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programWakaf.delete({ where: { id } });
};

module.exports = { getAll, create, updateStatus, getSummary, recalcAllTerkumpul, getRekening, createRekening, updateRekening, deleteRekening, getAllProgram, getActiveProgram, createProgram, updateProgram, deleteProgram, getAllWakaf, getActiveWakaf, createWakaf, updateWakaf, deleteWakaf };
