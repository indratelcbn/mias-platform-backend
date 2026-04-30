const prisma = require('../lib/prisma');

const ALLOWED_FIELDS = ['nama', 'alamat', 'rt', 'rw', 'kabKota', 'provinsi', 'telepon', 'kategori', 'berhak', 'status', 'prioritas'];
const pickFields = (data = {}) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (data[k] !== undefined) out[k] = data[k] === '' ? null : data[k];
  }
  return out;
};

const getAll = async ({ page = 1, limit = 20, kategori, berhak, status, prioritas, rt, rw, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (kategori) where.kategori = kategori;
  if (berhak) where.berhak = berhak;
  if (status) where.status = status;
  if (prioritas) where.prioritas = prioritas;
  if (rt) where.rt = rt;
  if (rw) where.rw = rw;
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: 'insensitive' } },
      { alamat: { contains: search, mode: 'insensitive' } },
      { kabKota: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.mustahik.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mustahik.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const item = await prisma.mustahik.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Data mustahik tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const create = async (data) => {
  return prisma.mustahik.create({ data: pickFields(data) });
};

const createMany = async (records) => {
  return prisma.mustahik.createMany({ data: records, skipDuplicates: true });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.mustahik.update({ where: { id }, data: pickFields(data) });
};

const remove = async (id) => {
  await getById(id);
  return prisma.mustahik.delete({ where: { id } });
};

const exportAll = async ({ kategori, berhak, status, prioritas, rt, rw } = {}) => {
  const where = {};
  if (kategori) where.kategori = kategori;
  if (berhak) where.berhak = berhak;
  if (status) where.status = status;
  if (prioritas) where.prioritas = prioritas;
  if (rt) where.rt = rt;
  if (rw) where.rw = rw;
  return prisma.mustahik.findMany({ where, orderBy: { nama: 'asc' } });
};

module.exports = { getAll, getById, create, createMany, update, remove, exportAll };
