const prisma = require('../lib/prisma');

const getAll = async ({ kategori, tahun } = {}) => {
  const where = {};
  if (kategori) where.kategori = kategori;
  if (tahun) where.tahun = Number(tahun);
  return prisma.galeri.findMany({
    where,
    orderBy: [{ tahun: 'desc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const getAllAdmin = async ({ page = 1, limit = 20, kategori, tahun } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (kategori) where.kategori = kategori;
  if (tahun) where.tahun = Number(tahun);
  const [data, total] = await Promise.all([
    prisma.galeri.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ tahun: 'desc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.galeri.count({ where }),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const item = await prisma.galeri.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Foto galeri tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const create = async (data) => {
  return prisma.galeri.create({ data });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.galeri.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.galeri.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
