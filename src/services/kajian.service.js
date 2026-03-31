const prisma = require('../lib/prisma');

const getAll = async ({ page = 1, limit = 10, ustadz, tanggalDari, tanggalSampai } = {}) => {
  const skip = (page - 1) * limit;

  const where = { isPublished: true };

  if (ustadz) {
    where.ustadz = { contains: ustadz, mode: 'insensitive' };
  }
  if (tanggalDari || tanggalSampai) {
    where.tanggal = {};
    if (tanggalDari) where.tanggal.gte = new Date(tanggalDari);
    if (tanggalSampai) where.tanggal.lte = new Date(tanggalSampai);
  }

  const [data, total] = await Promise.all([
    prisma.kajian.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { tanggal: 'asc' },
    }),
    prisma.kajian.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllAdmin = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.kajian.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { nama: true } } },
    }),
    prisma.kajian.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const kajian = await prisma.kajian.findUnique({ where: { id } });
  if (!kajian) {
    const err = new Error('Kajian tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return kajian;
};

const create = async (data) => {
  return prisma.kajian.create({ data });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.kajian.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.kajian.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
