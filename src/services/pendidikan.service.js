const prisma = require('../lib/prisma');

// ─── PendidikanInfo (Info per kategori) ───────────────────────────────────────

const getInfoByKategori = async (kategori) => {
  return prisma.pendidikanInfo.findUnique({ where: { kategori } });
};

const getAllInfo = async () => {
  return prisma.pendidikanInfo.findMany({ orderBy: { kategori: 'asc' } });
};

const upsertInfo = async (kategori, data) => {
  return prisma.pendidikanInfo.upsert({
    where: { kategori },
    update: data,
    create: { kategori, ...data },
  });
};

// ─── PendidikanFoto (Dokumentasi foto) ───────────────────────────────────────

const getFotoByKategori = async (kategori) => {
  return prisma.pendidikanFoto.findMany({
    where: { kategori },
    orderBy: [{ tahun: 'desc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const getYearsByKategori = async (kategori) => {
  const rows = await prisma.pendidikanFoto.findMany({
    where: { kategori },
    select: { tahun: true },
    distinct: ['tahun'],
    orderBy: { tahun: 'desc' },
  });
  return rows.map((r) => r.tahun);
};

const getAllFotoAdmin = async ({ page = 1, limit = 20, kategori, tahun } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (kategori) where.kategori = kategori;
  if (tahun) where.tahun = Number(tahun);
  const [data, total] = await Promise.all([
    prisma.pendidikanFoto.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ tahun: 'desc' }, { kategori: 'asc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.pendidikanFoto.count({ where }),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getFotoById = async (id) => {
  const item = await prisma.pendidikanFoto.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Foto tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const createFoto = async (data) => prisma.pendidikanFoto.create({ data });

const updateFoto = async (id, data) => {
  await getFotoById(id);
  return prisma.pendidikanFoto.update({ where: { id }, data });
};

const removeFoto = async (id) => {
  await getFotoById(id);
  return prisma.pendidikanFoto.delete({ where: { id } });
};

module.exports = {
  getInfoByKategori,
  getAllInfo,
  upsertInfo,
  getFotoByKategori,
  getYearsByKategori,
  getAllFotoAdmin,
  getFotoById,
  createFoto,
  updateFoto,
  removeFoto,
};
