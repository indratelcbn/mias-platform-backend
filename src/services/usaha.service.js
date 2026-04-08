const prisma = require('../lib/prisma');

// ─── Umroh ────────────────────────────────────────────────────────────────────

const getAllUmroh = async ({ onlyActive = false } = {}) => {
  const where = onlyActive ? { isActive: true } : {};
  return prisma.umrohProgram.findMany({
    where,
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const getAllUmrohAdmin = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.umrohProgram.findMany({
      skip,
      take: Number(limit),
      orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.umrohProgram.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getUmrohById = async (id) => {
  const item = await prisma.umrohProgram.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Program umroh tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const createUmroh = async (data) => prisma.umrohProgram.create({ data });

const updateUmroh = async (id, data) => {
  await getUmrohById(id);
  return prisma.umrohProgram.update({ where: { id }, data });
};

const removeUmroh = async (id) => {
  await getUmrohById(id);
  return prisma.umrohProgram.delete({ where: { id } });
};

// ─── Mias Mart ────────────────────────────────────────────────────────────────

const getAllMart = async ({ onlyActive = false } = {}) => {
  const where = onlyActive ? { isActive: true } : {};
  return prisma.miasMartProduk.findMany({
    where,
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
};

const getAllMartAdmin = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.miasMartProduk.findMany({
      skip,
      take: Number(limit),
      orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.miasMartProduk.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getMartById = async (id) => {
  const item = await prisma.miasMartProduk.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Produk tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const createMart = async (data) => prisma.miasMartProduk.create({ data });

const updateMart = async (id, data) => {
  await getMartById(id);
  return prisma.miasMartProduk.update({ where: { id }, data });
};

const removeMart = async (id) => {
  await getMartById(id);
  return prisma.miasMartProduk.delete({ where: { id } });
};

module.exports = {
  getAllUmroh, getAllUmrohAdmin, getUmrohById, createUmroh, updateUmroh, removeUmroh,
  getAllMart, getAllMartAdmin, getMartById, createMart, updateMart, removeMart,
};
