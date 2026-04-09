const prisma = require('../lib/prisma');

const getAll = async ({ tahun } = {}) => {
  const where = {};
  if (tahun) where.tahun = Number(tahun);

  return prisma.qurbanFoto.findMany({
    where,
    orderBy: [{ tahun: 'desc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const getAdmin = async ({ tahun, page = 1, limit = 24 } = {}) => {
  const where = {};
  if (tahun) where.tahun = Number(tahun);

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.qurbanFoto.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ tahun: 'desc' }, { urutan: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.qurbanFoto.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const getById = async (id) => {
  const item = await prisma.qurbanFoto.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Foto qurban tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const create = async (data) => prisma.qurbanFoto.create({ data });

const update = async (id, data) => {
  await getById(id);
  return prisma.qurbanFoto.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.qurbanFoto.delete({ where: { id } });
};

module.exports = { getAll, getAdmin, getById, create, update, remove };