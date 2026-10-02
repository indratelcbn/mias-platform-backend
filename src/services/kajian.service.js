const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
const {
  hasKitabTerjemahFileColumn,
} = require('../lib/profil-pemateri-schema');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BULAN_ID = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
];

function slugifyName(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')      // keep alphanumeric + space + hyphen
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildSlugBase(ustadz, tanggal) {
  const d = new Date(tanggal);
  const day  = d.getDate();
  const month = BULAN_ID[d.getMonth()];
  const year  = d.getFullYear();
  return `${slugifyName(ustadz)}-${day}-${month}-${year}`;
}

async function generateUniqueSlug(ustadz, tanggal, excludeId = null) {
  const base = buildSlugBase(ustadz, tanggal);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.kajian.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

function deleteFile(filePath) {
  if (!filePath) return;
  const base = filePath.replace(/^\/uploads\//, '');
  const fp = path.join(__dirname, '../../uploads', base);
  try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
}

// Enrich kajian rows with pemateri kitab data where kajian has no kitab of its own.
// Also attaches kitabTerjemahFile (virtual) from pemateri for all rows.
async function enrichKitabFromPemateri(rows) {
  if (!rows.length) return rows;

  const allNames = [...new Set(rows.map(k => k.ustadz).filter(Boolean))];
  if (!allNames.length) return rows;

  const hasKitabTerjemahFile = await hasKitabTerjemahFileColumn();
  const pemateriList = await prisma.profilPemateri.findMany({
    where: { nama: { in: allNames }, isActive: true },
    select: {
      nama: true,
      kitab: true,
      kitabArabFile: true,
      ...(hasKitabTerjemahFile && { kitabTerjemahFile: true }),
    },
  });
  const pMap = new Map(pemateriList.map(p => [p.nama, p]));

  return rows.map(k => {
    const p = pMap.get(k.ustadz);
    if (!p) return k;

    const enriched = { ...k };

    // Fill kitab / kitabFile from pemateri when the kajian has none
    if (!k.kitab && !k.kitabFile) {
      enriched.kitab = p.kitab;
      enriched.kitabFile = p.kitabArabFile || null;
    }

    // Always attach kitabTerjemahFile from pemateri (virtual field on response)
    if (hasKitabTerjemahFile && p.kitabTerjemahFile && !enriched.kitabTerjemahFile) {
      enriched.kitabTerjemahFile = p.kitabTerjemahFile;
    }

    return enriched;
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

const getById = async (idOrSlug) => {
  let kajian;
  if (UUID_RE.test(idOrSlug)) {
    kajian = await prisma.kajian.findUnique({ where: { id: idOrSlug } });
  } else {
    kajian = await prisma.kajian.findUnique({ where: { slug: idOrSlug } });
  }

  if (!kajian) {
    const err = new Error('Kajian tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Lazy backfill: generate slug for legacy records that don't have one
  if (!kajian.slug) {
    try {
      const slug = await generateUniqueSlug(kajian.ustadz, kajian.tanggal, kajian.id);
      kajian = await prisma.kajian.update({ where: { id: kajian.id }, data: { slug } });
    } catch {}
  }

  const [enriched] = await enrichKitabFromPemateri([kajian]);
  return enriched;
};

const create = async (data) => {
  const slug = await generateUniqueSlug(data.ustadz, data.tanggal);
  return prisma.kajian.create({ data: { ...data, slug } });
};

const update = async (id, data, newKitabFilename, kitabFileUrl, newMateriPdfFilename, materiFileUrl) => {
  const curr = await getById(id);
  // Only delete old local uploads when being replaced
  if (newKitabFilename && curr.kitabFile?.startsWith('/uploads/kajian_kitab/')) {
    deleteFile(curr.kitabFile);
  }
  if (newMateriPdfFilename && curr.materiFile?.startsWith('/uploads/kajian_materi/')) {
    deleteFile(curr.materiFile);
  }

  // Regenerate slug when ustadz or tanggal changes
  let newSlug;
  const newUstadz = data.ustadz !== undefined ? data.ustadz : curr.ustadz;
  const newTanggal = data.tanggal !== undefined ? data.tanggal : curr.tanggal;
  const ustadzChanged = data.ustadz !== undefined && data.ustadz !== curr.ustadz;
  const tanggalChanged = data.tanggal !== undefined &&
    new Date(data.tanggal).toDateString() !== new Date(curr.tanggal).toDateString();
  if (!curr.slug || ustadzChanged || tanggalChanged) {
    newSlug = await generateUniqueSlug(newUstadz, newTanggal, id);
  }

  let kitabFileVal;
  if (newKitabFilename) {
    kitabFileVal = `/uploads/kajian_kitab/${newKitabFilename}`;
  } else if (kitabFileUrl !== undefined) {
    kitabFileVal = kitabFileUrl || null;
  }

  let materiFileVal;
  if (newMateriPdfFilename) {
    materiFileVal = `/uploads/kajian_materi/${newMateriPdfFilename}`;
  } else if (materiFileUrl !== undefined) {
    materiFileVal = materiFileUrl || null;
  }

  return prisma.kajian.update({
    where: { id },
    data: {
      ...data,
      ...(newSlug && { slug: newSlug }),
      ...(kitabFileVal !== undefined && { kitabFile: kitabFileVal }),
      ...(materiFileVal !== undefined && { materiFile: materiFileVal }),
    },
  });
};

const remove = async (id) => {
  const curr = await getById(id);
  if (curr.kitabFile) deleteFile(curr.kitabFile);
  if (curr.materiFile) deleteFile(curr.materiFile);
  return prisma.kajian.delete({ where: { id } });
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
