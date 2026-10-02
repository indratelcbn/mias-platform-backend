const prisma = require('./prisma');

let hasKitabTerjemahFileColumnCache;

const basePemateriSelect = {
  id: true,
  nama: true,
  foto: true,
  kitab: true,
  kitabArabFile: true,
  jenis: true,
  hari: true,
  waktu: true,
  jam: true,
  keterangan: true,
  youtube: true,
  urutan: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

async function hasKitabTerjemahFileColumn() {
  if (hasKitabTerjemahFileColumnCache !== undefined) return hasKitabTerjemahFileColumnCache;

  const result = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profil_pemateri'
        AND column_name = 'kitab_terjemah_file'
    ) AS "exists"
  `;

  hasKitabTerjemahFileColumnCache = Boolean(result[0] && result[0].exists);
  return hasKitabTerjemahFileColumnCache;
}

async function getPemateriSelect() {
  const hasKitabTerjemahFile = await hasKitabTerjemahFileColumn();
  return {
    ...basePemateriSelect,
    ...(hasKitabTerjemahFile && { kitabTerjemahFile: true }),
  };
}

function serializePemateri(row) {
  return {
    ...row,
    kitabTerjemahFile: row.kitabTerjemahFile || null,
    kitabFile: row.kitabArabFile || null,
  };
}

module.exports = {
  hasKitabTerjemahFileColumn,
  getPemateriSelect,
  serializePemateri,
};
