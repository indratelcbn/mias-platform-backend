const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Admin: list semua ujian ──────────────────────────────────────────────────
const listUjian = async ({ page = 1, limit = 20, status } = {}) => {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  const [data, total] = await Promise.all([
    prisma.ujian.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { soal: true, peserta: true } } },
    }),
    prisma.ujian.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Admin: create ujian ──────────────────────────────────────────────────────
const createUjian = async (data) => {
  return prisma.ujian.create({ data });
};

// ─── Admin: get detail ujian ──────────────────────────────────────────────────
const getUjianById = async (id) => {
  return prisma.ujian.findUnique({
    where: { id },
    include: { _count: { select: { soal: true, peserta: true } } },
  });
};

// ─── Admin: update ujian ──────────────────────────────────────────────────────
const updateUjian = async (id, data) => {
  return prisma.ujian.update({ where: { id }, data });
};

// ─── Admin: delete ujian ──────────────────────────────────────────────────────
const deleteUjian = async (id) => {
  return prisma.ujian.delete({ where: { id } });
};

// ─── Admin: ubah status ujian ─────────────────────────────────────────────────
const updateStatusUjian = async (id, status) => {
  return prisma.ujian.update({ where: { id }, data: { status } });
};

// ─── Admin: list soal ─────────────────────────────────────────────────────────
const listSoal = async (ujianId) => {
  return prisma.soalUjian.findMany({
    where: { ujianId },
    orderBy: { urutan: 'asc' },
  });
};

// ─── Admin: tambah soal ───────────────────────────────────────────────────────
const createSoal = async (ujianId, data) => {
  const last = await prisma.soalUjian.findFirst({
    where: { ujianId },
    orderBy: { urutan: 'desc' },
  });
  return prisma.soalUjian.create({
    data: { ujianId, urutan: (last?.urutan ?? -1) + 1, ...data },
  });
};

// ─── Admin: update soal ───────────────────────────────────────────────────────
const updateSoal = async (soalId, data) => {
  return prisma.soalUjian.update({ where: { id: soalId }, data });
};

// ─── Admin: hapus soal ────────────────────────────────────────────────────────
const deleteSoal = async (soalId) => {
  return prisma.soalUjian.delete({ where: { id: soalId } });
};

// ─── Admin: import soal (preview) — tidak menyimpan ke DB ────────────────────
const previewImport = async (ujianId, rows) => {
  const valid = [];
  const invalid = [];
  const KUNCI_VALID = ['A', 'B', 'C', 'D'];
  const lastSoal = await prisma.soalUjian.findFirst({
    where: { ujianId },
    orderBy: { urutan: 'desc' },
  });
  let urutanBase = (lastSoal?.urutan ?? -1) + 1;

  rows.forEach((row, idx) => {
    const errors = [];
    if (!row.teks?.trim()) errors.push('teks soal kosong');
    if (!row.pilihanA?.trim()) errors.push('pilihan A kosong');
    if (!row.pilihanB?.trim()) errors.push('pilihan B kosong');
    if (!row.pilihanC?.trim()) errors.push('pilihan C kosong');
    if (!row.pilihanD?.trim()) errors.push('pilihan D kosong');
    const kunci = String(row.kunci ?? '').toUpperCase().trim();
    if (!KUNCI_VALID.includes(kunci)) errors.push(`kunci jawaban tidak valid: "${row.kunci}"`);
    const bobot = Number(row.bobot ?? 1);
    if (isNaN(bobot) || bobot < 1) errors.push('bobot harus angka ≥ 1');

    if (errors.length) {
      invalid.push({ baris: idx + 1, errors, data: row });
    } else {
      valid.push({
        teks: row.teks.trim(),
        pilihanA: row.pilihanA.trim(),
        pilihanB: row.pilihanB.trim(),
        pilihanC: row.pilihanC.trim(),
        pilihanD: row.pilihanD.trim(),
        kunciJawaban: kunci,
        bobot,
        urutan: urutanBase++,
      });
    }
  });

  return { valid, invalid, totalValid: valid.length, totalInvalid: invalid.length };
};

// ─── Admin: konfirmasi import — simpan ke DB ──────────────────────────────────
const confirmImport = async (ujianId, rows) => {
  const { valid, invalid } = await previewImport(ujianId, rows);
  if (!valid.length) return { inserted: 0, skipped: invalid.length };
  await prisma.soalUjian.createMany({
    data: valid.map((r) => ({ ujianId, ...r })),
  });
  return { inserted: valid.length, skipped: invalid.length };
};

// ─── Admin: list peserta ──────────────────────────────────────────────────────
const listPeserta = async (ujianId, { page = 1, limit = 50 } = {}) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.pesertaUjian.findMany({
      where: { ujianId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pesertaUjian.count({ where: { ujianId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Admin: rekap nilai ───────────────────────────────────────────────────────
const rekapNilai = async (ujianId) => {
  const peserta = await prisma.pesertaUjian.findMany({
    where: { ujianId, status: 'SELESAI' },
    orderBy: { score: 'desc' },
  });
  const total = peserta.length;
  const lulus = peserta.filter((p) => p.isPassed).length;
  const avgScore = total ? peserta.reduce((s, p) => s + (p.score ?? 0), 0) / total : 0;
  return { total, lulus, tidakLulus: total - lulus, avgScore, peserta };
};

// ─── Publik: masuk ujian ──────────────────────────────────────────────────────
const masukUjian = async ({ kodeUjian, namaLengkap, identitas }) => {
  const ujian = await prisma.ujian.findUnique({
    where: { kodeUjian },
    include: { _count: { select: { soal: true } } },
  });
  if (!ujian) return { error: 'Kode ujian tidak ditemukan.' };
  if (ujian.status !== 'PUBLISHED') return { error: 'Ujian belum tersedia.' };

  const now = new Date();
  if (now < ujian.tanggalMulai) return { error: 'Ujian belum dibuka.' };
  if (now > ujian.tanggalSelesai) return { error: 'Ujian sudah ditutup.' };

  // cek percobaan
  const percobaan = await prisma.pesertaUjian.count({
    where: { ujianId: ujian.id, identitas },
  });
  if (percobaan >= ujian.maxPercobaan) {
    return { error: `Batas percobaan (${ujian.maxPercobaan}×) sudah tercapai.` };
  }

  // cek sesi aktif yang masih berlaku
  const aktif = await prisma.pesertaUjian.findFirst({
    where: { ujianId: ujian.id, identitas, status: 'AKTIF' },
    orderBy: { startedAt: 'desc' },
  });
  if (aktif) {
    const elapsed = Math.floor((now - aktif.startedAt) / 1000);
    const sisaDetik = ujian.durasi * 60 - elapsed;
    if (sisaDetik > 0) return { pesertaId: aktif.id, resumed: true, sisaDetik };
    // waktu habis — expire sesi lama
    await prisma.pesertaUjian.update({ where: { id: aktif.id }, data: { status: 'EXPIRED' } });
  }

  // buat sesi baru
  const sesi = await prisma.pesertaUjian.create({
    data: {
      ujianId: ujian.id,
      namaLengkap,
      identitas,
      percobaan: percobaan + 1,
      status: 'AKTIF',
    },
  });
  return { pesertaId: sesi.id, resumed: false, sisaDetik: ujian.durasi * 60 };
};

// ─── Publik: ambil sesi + soal + jawaban tersimpan ───────────────────────────
const getSesi = async (pesertaId) => {
  const peserta = await prisma.pesertaUjian.findUnique({
    where: { id: pesertaId },
    include: {
      ujian: true,
      jawaban: true,
    },
  });
  if (!peserta) return null;

  // hitung sisa waktu
  const elapsed = Math.floor((Date.now() - peserta.startedAt.getTime()) / 1000);
  const sisaDetik = Math.max(0, peserta.ujian.durasi * 60 - elapsed);

  // auto-expire jika waktu habis
  if (sisaDetik === 0 && peserta.status === 'AKTIF') {
    await autoSubmit(pesertaId);
    return getSesi(pesertaId);
  }

  const soal = await prisma.soalUjian.findMany({
    where: { ujianId: peserta.ujianId },
    orderBy: { urutan: 'asc' },
    select: { id: true, teks: true, pilihanA: true, pilihanB: true, pilihanC: true, pilihanD: true, bobot: true, urutan: true },
  });

  const jawabanMap = {};
  peserta.jawaban.forEach((j) => { jawabanMap[j.soalId] = j.jawaban; });

  return {
    pesertaId: peserta.id,
    ujian: {
      id: peserta.ujian.id,
      judul: peserta.ujian.judul,
      petunjuk: peserta.ujian.petunjuk,
      durasi: peserta.ujian.durasi,
    },
    namaLengkap: peserta.namaLengkap,
    status: peserta.status,
    sisaDetik,
    soal,
    jawabanMap,
    score: peserta.score,
    isPassed: peserta.isPassed,
  };
};

// ─── Publik: simpan jawaban ───────────────────────────────────────────────────
const simpanJawaban = async (pesertaId, soalId, jawaban) => {
  const peserta = await prisma.pesertaUjian.findUnique({ where: { id: pesertaId } });
  if (!peserta || peserta.status !== 'AKTIF') return { error: 'Sesi tidak aktif.' };

  const VALID = ['A', 'B', 'C', 'D'];
  if (!VALID.includes(jawaban)) return { error: 'Jawaban tidak valid.' };

  await prisma.jawabanUjian.upsert({
    where: { pesertaId_soalId: { pesertaId, soalId } },
    update: { jawaban, savedAt: new Date() },
    create: { pesertaId, soalId, jawaban },
  });
  return { ok: true };
};

// ─── Publik: submit ujian ─────────────────────────────────────────────────────
const submitUjian = async (pesertaId) => {
  const peserta = await prisma.pesertaUjian.findUnique({
    where: { id: pesertaId },
    include: { ujian: true, jawaban: true },
  });
  if (!peserta) return { error: 'Sesi tidak ditemukan.' };
  if (peserta.status === 'SELESAI') return { error: 'Ujian sudah dikumpulkan.' };

  const soal = await prisma.soalUjian.findMany({ where: { ujianId: peserta.ujianId } });
  let totalBobot = 0;
  let bobotBenar = 0;
  soal.forEach((s) => {
    totalBobot += s.bobot;
    const jwb = peserta.jawaban.find((j) => j.soalId === s.id);
    if (jwb && jwb.jawaban === s.kunciJawaban) bobotBenar += s.bobot;
  });

  const score = totalBobot ? (bobotBenar / totalBobot) * 100 : 0;
  const isPassed = score >= peserta.ujian.passingGrade;

  await prisma.pesertaUjian.update({
    where: { id: pesertaId },
    data: { status: 'SELESAI', finishedAt: new Date(), score, isPassed },
  });

  return {
    score: Math.round(score * 10) / 10,
    isPassed,
    tampilNilai: peserta.ujian.tampilNilai,
    passingGrade: peserta.ujian.passingGrade,
  };
};

// ─── Internal: auto-submit jika waktu habis ────────────────────────────────────
const autoSubmit = async (pesertaId) => {
  const peserta = await prisma.pesertaUjian.findUnique({ where: { id: pesertaId } });
  if (!peserta || peserta.status !== 'AKTIF') return;
  await submitUjian(pesertaId);
};

// ─── Publik: ambil hasil ──────────────────────────────────────────────────────
const getHasil = async (pesertaId) => {
  const peserta = await prisma.pesertaUjian.findUnique({
    where: { id: pesertaId },
    include: { ujian: { select: { judul: true, passingGrade: true, tampilNilai: true } } },
  });
  if (!peserta) return null;
  if (peserta.status !== 'SELESAI') return { error: 'Ujian belum selesai.' };
  return {
    namaLengkap: peserta.namaLengkap,
    judul: peserta.ujian.judul,
    score: peserta.score,
    isPassed: peserta.isPassed,
    passingGrade: peserta.ujian.passingGrade,
    tampilNilai: peserta.ujian.tampilNilai,
    finishedAt: peserta.finishedAt,
  };
};

module.exports = {
  listUjian, createUjian, getUjianById, updateUjian, deleteUjian, updateStatusUjian,
  listSoal, createSoal, updateSoal, deleteSoal, previewImport, confirmImport,
  listPeserta, rekapNilai,
  masukUjian, getSesi, simpanJawaban, submitUjian, getHasil,
};
