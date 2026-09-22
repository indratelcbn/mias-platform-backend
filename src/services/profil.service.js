const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');

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
  return prisma.profilPemateri.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }, { nama: 'asc' }],
  });
}

async function getPemateriById(id) {
  const p = await prisma.profilPemateri.findUnique({ where: { id } });
  if (!p) { const e = new Error('Pemateri tidak ditemukan'); e.statusCode = 404; throw e; }
  return p;
}

async function createPemateri(data, fotoFilename, kitabFilename) {
  return prisma.profilPemateri.create({
    data: {
      ...data,
      ...(fotoFilename  && { foto:      `/uploads/profil/${fotoFilename}` }),
      ...(kitabFilename && { kitabFile: `/uploads/profil_kitab/${kitabFilename}` }),
    },
  });
}

async function updatePemateri(id, data, newFotoFilename, newKitabFilename) {
  const curr = await getPemateriById(id);
  if (newFotoFilename  && curr.foto)      deleteFile(curr.foto, '');
  if (newKitabFilename && curr.kitabFile) deleteFile(curr.kitabFile, '');
  const fotoVal      = newFotoFilename  ? `/uploads/profil/${newFotoFilename}`              : undefined;
  const kitabFileVal = newKitabFilename ? `/uploads/profil_kitab/${newKitabFilename}` : undefined;
  return prisma.profilPemateri.update({
    where: { id },
    data: {
      ...data,
      ...(fotoVal      !== undefined && { foto:      fotoVal }),
      ...(kitabFileVal !== undefined && { kitabFile: kitabFileVal }),
    },
  });
}

async function deletePemateri(id) {
  const p = await getPemateriById(id);
  if (p.foto)      deleteFile(p.foto, '');
  if (p.kitabFile) deleteFile(p.kitabFile, '');
  return prisma.profilPemateri.delete({ where: { id } });
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
  getAllPemateri, getPemateriById, createPemateri, updatePemateri, deletePemateri,
  getHeroStats,
};
