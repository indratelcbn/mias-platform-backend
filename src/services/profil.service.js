const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
const {
  hasKitabTerjemahFileColumn,
  getPemateriSelect,
  serializePemateri,
} = require('../lib/profil-pemateri-schema');

function deleteFile(filename, subfolder) {
  if (!filename) return;
  // filename may be a full URL path like /uploads/profil/xxx.webp
  const base = filename.replace(/^\/uploads\//, '');
  const fp = path.join(__dirname, '../../uploads', base);
  try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
}

// ─── Sejarah ──────────────────────────────────────────────────────────────────
async function getSejarah() {
  let row = await prisma.profilSejarah.findUnique({ where: { id: 1 } });
  if (!row) row = await prisma.profilSejarah.create({ data: { id: 1 } });
  return row;
}

async function updateSejarah(data, newFotoFilename) {
  const curr = await getSejarah();
  if (newFotoFilename && curr.foto) deleteFile(curr.foto, '');
  const fotoVal = newFotoFilename ? `/uploads/profil/${newFotoFilename}` : undefined;
  return prisma.profilSejarah.upsert({
    where: { id: 1 },
    update: { ...data, ...(fotoVal !== undefined && { foto: fotoVal }) },
    create: { id: 1, ...data, ...(fotoVal !== undefined && { foto: fotoVal }) },
  });
}

// ─── Visi Misi ────────────────────────────────────────────────────────────────
async function getVisiMisi() {
  let row = await prisma.profilVisiMisi.findUnique({ where: { id: 1 } });
  if (!row) row = await prisma.profilVisiMisi.create({ data: { id: 1 } });
  return row;
}

async function updateVisiMisi(data) {
  return prisma.profilVisiMisi.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}

// ─── Fasilitas ────────────────────────────────────────────────────────────────
async function getAllFasilitas({ onlyActive = false } = {}) {
  return prisma.profilFasilitas.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    include: { foto: { orderBy: { urutan: 'asc' } } },
    orderBy: { urutan: 'asc' },
  });
}

async function getFasilitasById(id) {
  const f = await prisma.profilFasilitas.findUnique({
    where: { id },
    include: { foto: { orderBy: { urutan: 'asc' } } },
  });
  if (!f) { const e = new Error('Fasilitas tidak ditemukan'); e.statusCode = 404; throw e; }
  return f;
}

async function createFasilitas(data) {
  return prisma.profilFasilitas.create({ data, include: { foto: true } });
}

async function updateFasilitas(id, data) {
  await getFasilitasById(id);
  return prisma.profilFasilitas.update({ where: { id }, data, include: { foto: true } });
}

async function deleteFasilitas(id) {
  const f = await getFasilitasById(id);
  for (const p of f.foto) deleteFile(p.foto, '');
  return prisma.profilFasilitas.delete({ where: { id } });
}

async function addFasilitasFoto(fasilitasId, fotoFilename, caption, urutan) {
  await getFasilitasById(fasilitasId);
  return prisma.profilFasilitasFoto.create({
    data: {
      fasilitasId,
      foto: `/uploads/profil_fasilitas/${fotoFilename}`,
      caption: caption || null,
      urutan: Number(urutan) || 0,
    },
  });
}

async function deleteFasilitasFoto(fotoId) {
  const p = await prisma.profilFasilitasFoto.findUnique({ where: { id: fotoId } });
  if (!p) { const e = new Error('Foto tidak ditemukan'); e.statusCode = 404; throw e; }
  deleteFile(p.foto, '');
  return prisma.profilFasilitasFoto.delete({ where: { id: fotoId } });
}

// ─── Struktur Organisasi ──────────────────────────────────────────────────────
async function getStruktur() {
  let row = await prisma.profilStruktur.findUnique({ where: { id: 1 } });
  if (!row) row = await prisma.profilStruktur.create({ data: { id: 1 } });
  return row;
}

async function updateStruktur(data, newFotoFilename) {
  const curr = await getStruktur();
  if (newFotoFilename && curr.foto) deleteFile(curr.foto, '');
  const fotoVal = newFotoFilename ? `/uploads/profil/${newFotoFilename}` : undefined;
  return prisma.profilStruktur.upsert({
    where: { id: 1 },
    update: { ...data, ...(fotoVal !== undefined && { foto: fotoVal }) },
    create: { id: 1, ...data, ...(fotoVal !== undefined && { foto: fotoVal }) },
  });
}

// ─── Pemateri ─────────────────────────────────────────────────────────────────
async function getAllPemateri({ onlyActive = false } = {}) {
  const select = await getPemateriSelect();
  const rows = await prisma.profilPemateri.findMany({
    select,
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }, { nama: 'asc' }],
  });
  return rows.map(serializePemateri);
}

async function getPemateriById(id) {
  const select = await getPemateriSelect();
  const p = await prisma.profilPemateri.findUnique({ where: { id }, select });
  if (!p) { const e = new Error('Pemateri tidak ditemukan'); e.statusCode = 404; throw e; }
  return serializePemateri(p);
}

async function createPemateri(data, fotoFilename, kitabArabFilename, kitabTerjemahFilename) {
  const hasKitabTerjemahFile = await hasKitabTerjemahFileColumn();
  if (kitabTerjemahFilename && !hasKitabTerjemahFile) {
    deleteFile(`/uploads/profil_kitab/${kitabTerjemahFilename}`, '');
    const e = new Error('Database belum siap untuk Kitab Terjemah. Jalankan migrasi backend terlebih dahulu.');
    e.statusCode = 500;
    throw e;
  }

  const row = await prisma.profilPemateri.create({
    select: await getPemateriSelect(),
    data: {
      ...data,
      ...(fotoFilename && { foto: `/uploads/profil/${fotoFilename}` }),
      ...(kitabArabFilename && { kitabArabFile: `/uploads/profil_kitab/${kitabArabFilename}` }),
      ...(hasKitabTerjemahFile && kitabTerjemahFilename && { kitabTerjemahFile: `/uploads/profil_kitab/${kitabTerjemahFilename}` }),
    },
  });
  return serializePemateri(row);
}

async function updatePemateri(id, data, newFotoFilename, newKitabArabFilename, newKitabTerjemahFilename) {
  const curr = await getPemateriById(id);
  const hasKitabTerjemahFile = await hasKitabTerjemahFileColumn();
  if (newKitabTerjemahFilename && !hasKitabTerjemahFile) {
    deleteFile(`/uploads/profil_kitab/${newKitabTerjemahFilename}`, '');
    const e = new Error('Database belum siap untuk Kitab Terjemah. Jalankan migrasi backend terlebih dahulu.');
    e.statusCode = 500;
    throw e;
  }

  if (newFotoFilename && curr.foto) deleteFile(curr.foto, '');
  if (newKitabArabFilename && curr.kitabArabFile) deleteFile(curr.kitabArabFile, '');
  if (newKitabTerjemahFilename && curr.kitabTerjemahFile) deleteFile(curr.kitabTerjemahFile, '');
  const fotoVal = newFotoFilename ? `/uploads/profil/${newFotoFilename}` : undefined;
  const kitabArabFileVal = newKitabArabFilename ? `/uploads/profil_kitab/${newKitabArabFilename}` : undefined;
  const kitabTerjemahFileVal = newKitabTerjemahFilename ? `/uploads/profil_kitab/${newKitabTerjemahFilename}` : undefined;
  const row = await prisma.profilPemateri.update({
    select: await getPemateriSelect(),
    where: { id },
    data: {
      ...data,
      ...(fotoVal !== undefined && { foto: fotoVal }),
      ...(kitabArabFileVal !== undefined && { kitabArabFile: kitabArabFileVal }),
      ...(hasKitabTerjemahFile && kitabTerjemahFileVal !== undefined && { kitabTerjemahFile: kitabTerjemahFileVal }),
    },
  });
  return serializePemateri(row);
}

async function deletePemateri(id) {
  const p = await getPemateriById(id);
  if (p.foto) deleteFile(p.foto, '');
  if (p.kitabArabFile) deleteFile(p.kitabArabFile, '');
  if (p.kitabTerjemahFile) deleteFile(p.kitabTerjemahFile, '');
  return prisma.profilPemateri.delete({ where: { id } });
}

async function deletePemateriKitab(id, jenis) {
  const select = await getPemateriSelect();
  const p = await prisma.profilPemateri.findUnique({ where: { id }, select });
  if (!p) { const e = new Error('Pemateri tidak ditemukan'); e.statusCode = 404; throw e; }

  const hasKitabTerjemahFile = await hasKitabTerjemahFileColumn();

  if (jenis === 'arab') {
    if (!p.kitabArabFile) { const e = new Error('File Kitab Arab tidak ada.'); e.statusCode = 404; throw e; }
    deleteFile(p.kitabArabFile, '');
    const row = await prisma.profilPemateri.update({
      select,
      where: { id },
      data: { kitabArabFile: null },
    });
    return serializePemateri(row);
  }

  if (jenis === 'terjemah') {
    if (!hasKitabTerjemahFile) {
      const e = new Error('Fitur Kitab Terjemah belum tersedia. Jalankan migrasi database terlebih dahulu.');
      e.statusCode = 500; throw e;
    }
    if (!p.kitabTerjemahFile) { const e = new Error('File Kitab Terjemah tidak ada.'); e.statusCode = 404; throw e; }
    deleteFile(p.kitabTerjemahFile, '');
    const row = await prisma.profilPemateri.update({
      select,
      where: { id },
      data: { kitabTerjemahFile: null },
    });
    return serializePemateri(row);
  }

  const e = new Error('Jenis kitab tidak valid. Gunakan "arab" atau "terjemah".');
  e.statusCode = 400; throw e;
}

// ─── Hero Stats (public) ──────────────────────────────────────────────────────
async function getHeroStats() {
  const safe = (p, fb) => p.catch(() => fb);

  const [pemateriList, programInfaq, programWakaf] = await Promise.all([
    safe(
      prisma.profilPemateri.findMany({
        where: { isActive: true },
        select: { jenis: true, hari: true },
      }),
      []
    ),
    safe(prisma.programDonasi.count({ where: { isActive: true } }), 0),
    safe(prisma.programWakaf.count({ where: { isActive: true } }), 0),
  ]);

  // Total Kajian = jumlah (pemateri x hari) untuk pemateri RUTIN.
  // Pemateri TEMATIK dihitung 1 kajian/orang (tidak punya hari rutin).
  let totalKajian = 0;
  for (const p of pemateriList) {
    if (p.jenis === 'RUTIN') {
      const hari = (p.hari || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      totalKajian += hari.length || 1;
    } else {
      totalKajian += 1;
    }
  }

  return {
    totalKajian,
    totalPemateri: pemateriList.length,
    totalProgram: (programInfaq || 0) + (programWakaf || 0),
    programInfaq: programInfaq || 0,
    programWakaf: programWakaf || 0,
  };
}

module.exports = {
  getSejarah, updateSejarah,
  getVisiMisi, updateVisiMisi,
  getAllFasilitas, getFasilitasById, createFasilitas, updateFasilitas, deleteFasilitas,
  addFasilitasFoto, deleteFasilitasFoto,
  getStruktur, updateStruktur,
  getAllPemateri, getPemateriById, createPemateri, updatePemateri, deletePemateri, deletePemateriKitab,
  getHeroStats,
};
