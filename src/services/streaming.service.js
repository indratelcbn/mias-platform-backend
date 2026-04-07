const prisma = require('../lib/prisma');

const getActive = async () => {
  return prisma.streaming.findFirst({
    where: { isLive: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getAll = async () => {
  return prisma.streaming.findMany({ orderBy: { createdAt: 'desc' } });
};

const getById = async (id) => {
  const item = await prisma.streaming.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Data streaming tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const create = async (data) => {
  return prisma.streaming.create({ data });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.streaming.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.streaming.delete({ where: { id } });
};

const setLive = async (id) => {
  // Turn off all live, then activate selected
  await prisma.streaming.updateMany({ data: { isLive: false } });
  return prisma.streaming.update({ where: { id }, data: { isLive: true } });
};

module.exports = { getActive, getAll, getById, create, update, remove, setLive };
