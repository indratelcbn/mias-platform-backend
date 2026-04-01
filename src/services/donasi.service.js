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
  return prisma.donasi.create({ data });
};

const updateStatus = async (id, status) => {
  const donasi = await prisma.donasi.findUnique({ where: { id } });
  if (!donasi) {
    const err = new Error('Data donasi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return prisma.donasi.update({ where: { id }, data: { status } });
};

const getSummary = async () => {
  const [total, verified, pending] = await Promise.all([
    prisma.donasi.aggregate({ _sum: { jumlah: true } }),
    prisma.donasi.aggregate({ where: { status: 'VERIFIED' }, _sum: { jumlah: true } }),
    prisma.donasi.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalDonasi: total._sum.jumlah || 0,
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
    where: { isActive: true },
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const createProgram = async (data) => {
  return prisma.programDonasi.create({
    data: {
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      target: parseFloat(data.target),
      terkumpul: parseFloat(data.terkumpul || 0),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      urutan: parseInt(data.urutan || 0),
    },
  });
};

const updateProgram = async (id, data) => {
  const prog = await prisma.programDonasi.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program donasi tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programDonasi.update({
    where: { id },
    data: {
      judul: data.judul,
      deskripsi: data.deskripsi ?? prog.deskripsi,
      target: data.target !== undefined ? parseFloat(data.target) : undefined,
      terkumpul: data.terkumpul !== undefined ? parseFloat(data.terkumpul) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      urutan: data.urutan !== undefined ? parseInt(data.urutan) : undefined,
    },
  });
};

const deleteProgram = async (id) => {
  const prog = await prisma.programDonasi.findUnique({ where: { id } });
  if (!prog) { const e = new Error('Program donasi tidak ditemukan.'); e.statusCode = 404; throw e; }
  return prisma.programDonasi.delete({ where: { id } });
};

module.exports = { getAll, create, updateStatus, getSummary, getRekening, createRekening, updateRekening, deleteRekening, getAllProgram, getActiveProgram, createProgram, updateProgram, deleteProgram };
