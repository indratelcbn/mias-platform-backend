const prisma = require('../lib/prisma');

const getAll = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.divisi.findMany({
      skip,
      take: Number(limit),
      orderBy: { urutan: 'asc' },
      include: { _count: { select: { programDonasi: true, programWakaf: true } } },
    }),
    prisma.divisi.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getActive = async () => {
  return prisma.divisi.findMany({
    where: { isActive: true },
    orderBy: { urutan: 'asc' },
  });
};

const getById = async (id) => {
  const divisi = await prisma.divisi.findUnique({
    where: { id },
    include: {
      programDonasi: { orderBy: { urutan: 'asc' } },
      programWakaf: { orderBy: { urutan: 'asc' } },
    },
  });
  if (!divisi) {
    const err = new Error('Divisi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return divisi;
};

const create = async (data) => {
  // Check duplicate name
  const existing = await prisma.divisi.findUnique({ where: { nama: data.nama } });
  if (existing) {
    const err = new Error('Nama divisi sudah ada.');
    err.statusCode = 400;
    throw err;
  }
  return prisma.divisi.create({
    data: {
      nama: data.nama,
      deskripsi: data.deskripsi || null,
    },
  });
};

const update = async (id, data) => {
  const divisi = await prisma.divisi.findUnique({ where: { id } });
  if (!divisi) {
    const err = new Error('Divisi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Check duplicate name if nama berubah
  if (data.nama && data.nama !== divisi.nama) {
    const existing = await prisma.divisi.findUnique({ where: { nama: data.nama } });
    if (existing) {
      const err = new Error('Nama divisi sudah ada.');
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.divisi.update({
    where: { id },
    data: {
      nama: data.nama || undefined,
      deskripsi: data.deskripsi !== undefined ? data.deskripsi : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      urutan: data.urutan !== undefined ? data.urutan : undefined,
    },
  });
};

const delete_ = async (id) => {
  const divisi = await prisma.divisi.findUnique({
    where: { id },
    include: { _count: { select: { programDonasi: true, programWakaf: true } } },
  });
  if (!divisi) {
    const err = new Error('Divisi tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Check if has programs
  if (divisi._count.programDonasi > 0 || divisi._count.programWakaf > 0) {
    const err = new Error('Tidak bisa menghapus divisi yang memiliki program. Hapus program terlebih dahulu.');
    err.statusCode = 400;
    throw err;
  }

  return prisma.divisi.delete({ where: { id } });
};

const reorder = async (orders) => {
  // orders: [{ id, urutan }, ...]
  const updates = orders.map(({ id, urutan }) =>
    prisma.divisi.update({ where: { id }, data: { urutan } })
  );
  return Promise.all(updates);
};

module.exports = { getAll, getActive, getById, create, update, delete: delete_, reorder };
