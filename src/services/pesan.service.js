const prisma = require('../lib/prisma');

const getAll = async ({ status, kategori, q } = {}) => {
  const where = {};

  if (status) where.status = status;
  if (kategori) where.kategori = kategori;
  if (q) {
    where.OR = [
      { nama: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { noHp: { contains: q, mode: 'insensitive' } },
      { subjek: { contains: q, mode: 'insensitive' } },
      { pesan: { contains: q, mode: 'insensitive' } },
    ];
  }

  return prisma.pesan.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
};

const create = async (data) => {
  return prisma.pesan.create({
    data: {
      nama: data.nama,
      email: data.email,
      noHp: data.noHp,
      kategori: data.kategori,
      subjek: data.subjek || null,
      pesan: data.pesan,
    },
  });
};

const updateStatus = async (id, status) => {
  const item = await prisma.pesan.findUnique({ where: { id } });
  if (!item) {
    const err = new Error('Pesan tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  return prisma.pesan.update({
    where: { id },
    data: {
      status,
      isRead: status === 'SUDAH_DITINDAKLANJUTI',
    },
  });
};

const getSummary = async () => {
  const [total, belum, sudah] = await Promise.all([
    prisma.pesan.count(),
    prisma.pesan.count({ where: { status: 'BELUM_DITINDAKLANJUTI' } }),
    prisma.pesan.count({ where: { status: 'SUDAH_DITINDAKLANJUTI' } }),
  ]);

  return {
    total,
    belumDitindaklanjuti: belum,
    sudahDitindaklanjuti: sudah,
  };
};

module.exports = { getAll, create, updateStatus, getSummary };
