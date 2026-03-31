const prisma = require('../lib/prisma');

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const generateUniqueSlug = async (judul, excludeId = null) => {
  let slug = slugify(judul);
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.artikel.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    counter++;
  }
};

const getAll = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const where = { isPublished: true };

  const [data, total] = await Promise.all([
    prisma.artikel.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, judul: true, slug: true, ringkasan: true, thumbnail: true, createdAt: true },
    }),
    prisma.artikel.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getAllAdmin = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.artikel.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { nama: true } } },
    }),
    prisma.artikel.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getBySlug = async (slug) => {
  const artikel = await prisma.artikel.findUnique({
    where: { slug },
    include: { creator: { select: { nama: true } } },
  });
  if (!artikel) {
    const err = new Error('Artikel tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return artikel;
};

const getById = async (id) => {
  const artikel = await prisma.artikel.findUnique({ where: { id } });
  if (!artikel) {
    const err = new Error('Artikel tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return artikel;
};

const create = async (data) => {
  const slug = await generateUniqueSlug(data.judul);
  return prisma.artikel.create({ data: { ...data, slug } });
};

const update = async (id, data) => {
  await getById(id);
  if (data.judul) {
    data.slug = await generateUniqueSlug(data.judul, id);
  }
  return prisma.artikel.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.artikel.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getBySlug, getById, create, update, remove };
