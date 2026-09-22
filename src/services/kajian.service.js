const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');

function deleteFile(filePath) {
  if (!filePath) return;
  const base = filePath.replace(/^\/uploads\//, '');
  const fp = path.join(__dirname, '../../uploads', base);
  try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
}

// Enrich kajian rows with pemateri kitab data where kajian has no kitab of its own
async function enrichKitabFromPemateri(rows) {
  const needsKitab = rows.filter(k => !k.kitab && !k.kitabFile);
  if (!needsKitab.length) return rows;

  const names = [...new Set(needsKitab.map(k => k.ustadz))];
  const pemateriList = await prisma.profilPemateri.findMany({
    where: { nama: { in: names }, isActive: true },
    select: { nama: true, kitab: true, kitabFile: true },
  });
  const pMap = new Map(pemateriList.map(p => [p.nama, p]));

  return rows.map(k => {
    if (!k.kitab && !k.kitabFile) {
      const p = pMap.get(k.ustadz);
      if (p) return { ...k, kitab: p.kitab, kitabFile: p.kitabFile };
    }
    return k;
  });
}

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

  const [rows, total] = await Promise.all([
    prisma.kajian.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { tanggal: 'desc' },
    }),
    prisma.kajian.count({ where }),
  ]);

  const data = await enrichKitabFromPemateri(rows);

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
  const [enriched] = await enrichKitabFromPemateri([kajian]);
  return enriched;
};

const create = async (data) => {
  return prisma.kajian.create({ data });
};

const update = async (id, data, newKitabFilename, kitabFileUrl) => {
  const curr = await getById(id);
  // Only delete the old file if it was a local upload being replaced
  if (newKitabFilename && curr.kitabFile?.startsWith('/uploads/kajian_kitab/')) {
    deleteFile(curr.kitabFile);
  }

  let kitabFileVal;
  if (newKitabFilename) {
    kitabFileVal = `/uploads/kajian_kitab/${newKitabFilename}`;
  } else if (kitabFileUrl !== undefined) {
    kitabFileVal = kitabFileUrl || null;
  }

  return prisma.kajian.update({
    where: { id },
    data: { ...data, ...(kitabFileVal !== undefined && { kitabFile: kitabFileVal }) },
  });
};

const remove = async (id) => {
  const curr = await getById(id);
  if (curr.kitabFile) deleteFile(curr.kitabFile);
  return prisma.kajian.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
