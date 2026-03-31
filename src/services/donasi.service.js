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
  return prisma.rekening.findMany({ where: { isActive: true } });
};

module.exports = { getAll, create, updateStatus, getSummary, getRekening };
