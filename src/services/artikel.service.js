const prisma = require('../lib/prisma');

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
};

const generateUniqueSlug = async (judul, excludeId = null) => {
  const base = slugify(judul) || 'artikel';
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? base : `${base}-${counter}`;
    const existing = await prisma.artikel.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    counter++;
  }
};

const PUBLIC_SELECT = {
  id: true,
  judul: true,
  slug: true,
  ringkasan: true,
  thumbnail: true,
  kategori: true,
  isHighlight: true,
  tanggalPublish: true,
  createdAt: true,
};

const getAll = async ({ page = 1, limit = 10, kategori, highlight, search } = {}) => {
  const skip = (page - 1) * Number(limit);
  const where = { isPublished: true };
  if (kategori) where.kategori = kategori;
  if (highlight === 'true' || highlight === true) where.isHighlight = true;
  if (search) {
    where.OR = [
      { judul: { contains: search, mode: 'insensitive' } },
      { ringkasan: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.artikel.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ tanggalPublish: 'desc' }, { createdAt: 'desc' }],
      select: PUBLIC_SELECT,
    }),
    prisma.artikel.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  };
};

const getAllAdmin = async ({ page = 1, limit = 20, search, status } = {}) => {
  const skip = (page - 1) * Number(limit);
  const where = {};
  if (status === 'draft') where.isPublished = false;
  if (status === 'published') where.isPublished = true;
  if (search) {
    where.OR = [
      { judul: { contains: search, mode: 'insensitive' } },
      { ringkasan: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.artikel.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ updatedAt: 'desc' }],
      include: { creator: { select: { nama: true } } },
    }),
    prisma.artikel.count({ where }),
  ]);
  return {
    data,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  };
};

const getBySlug = async (slug) => {
  const artikel = await prisma.artikel.findUnique({
    where: { slug },
    include: { creator: { select: { nama: true } } },
  });
  if (!artikel || !artikel.isPublished) {
    const err = new Error('Artikel tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  const related = await prisma.artikel.findMany({
    where: { isPublished: true, id: { not: artikel.id } },
    take: 3,
    orderBy: [{ tanggalPublish: 'desc' }, { createdAt: 'desc' }],
    select: PUBLIC_SELECT,
  });
  return { ...artikel, related };
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

const ALLOWED_FIELDS = [
  'judul', 'konten', 'ringkasan', 'thumbnail', 'kategori',
  'tanggalPublish', 'isHighlight', 'metaTitle', 'metaDescription',
  'isPublished', 'createdBy',
];

const sanitizeData = (data) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (data[k] !== undefined) out[k] = data[k];
  return out;
};

const create = async (data) => {
  const clean = sanitizeData(data);
  clean.slug = await generateUniqueSlug(clean.judul);
  // Auto-generate ringkasan from konten if not provided
  if (!clean.ringkasan && clean.konten) {
    clean.ringkasan = stripHtml(clean.konten).slice(0, 220);
  }
  if (!clean.metaTitle && clean.judul) clean.metaTitle = clean.judul.slice(0, 70);
  if (!clean.metaDescription && clean.ringkasan) {
    clean.metaDescription = clean.ringkasan.slice(0, 160);
  }
  if (clean.isPublished && !clean.tanggalPublish) {
    clean.tanggalPublish = new Date();
  }
  return prisma.artikel.create({ data: clean });
};

const update = async (id, data) => {
  await getById(id);
  const clean = sanitizeData(data);
  if (clean.judul) clean.slug = await generateUniqueSlug(clean.judul, id);
  // Auto-generate ringkasan if cleared and konten is present
  if (!clean.ringkasan && clean.konten) {
    clean.ringkasan = stripHtml(clean.konten).slice(0, 220);
  }
  return prisma.artikel.update({ where: { id }, data: clean });
};

const remove = async (id) => {
  await getById(id);
  return prisma.artikel.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getBySlug, getById, create, update, remove };
