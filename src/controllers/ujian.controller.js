const svc = require('../services/ujian.service');

// ─── Admin ────────────────────────────────────────────────────────────────────

const listUjian = async (req, res, next) => {
  try {
    const result = await svc.listUjian({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status || undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const createUjian = async (req, res, next) => {
  try {
    const { judul, deskripsi, kodeUjian, tanggalMulai, tanggalSelesai, durasi,
      passingGrade, maxPercobaan, petunjuk, tampilNilai } = req.body;
    const data = await svc.createUjian({
      judul, deskripsi, kodeUjian,
      tanggalMulai: new Date(tanggalMulai),
      tanggalSelesai: new Date(tanggalSelesai),
      durasi: Number(durasi),
      passingGrade: Number(passingGrade ?? 70),
      maxPercobaan: Number(maxPercobaan ?? 1),
      petunjuk, tampilNilai: Boolean(tampilNilai),
    });
    res.status(201).json({ success: true, message: 'Ujian berhasil dibuat.', data });
  } catch (err) { next(err); }
};

const getUjian = async (req, res, next) => {
  try {
    const data = await svc.getUjianById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Ujian tidak ditemukan.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const updateUjian = async (req, res, next) => {
  try {
    const { judul, deskripsi, kodeUjian, tanggalMulai, tanggalSelesai, durasi,
      passingGrade, maxPercobaan, petunjuk, tampilNilai } = req.body;
    const data = await svc.updateUjian(req.params.id, {
      ...(judul !== undefined && { judul }),
      ...(deskripsi !== undefined && { deskripsi }),
      ...(kodeUjian !== undefined && { kodeUjian }),
      ...(tanggalMulai !== undefined && { tanggalMulai: new Date(tanggalMulai) }),
      ...(tanggalSelesai !== undefined && { tanggalSelesai: new Date(tanggalSelesai) }),
      ...(durasi !== undefined && { durasi: Number(durasi) }),
      ...(passingGrade !== undefined && { passingGrade: Number(passingGrade) }),
      ...(maxPercobaan !== undefined && { maxPercobaan: Number(maxPercobaan) }),
      ...(petunjuk !== undefined && { petunjuk }),
      ...(tampilNilai !== undefined && { tampilNilai: Boolean(tampilNilai) }),
    });
    res.json({ success: true, message: 'Ujian berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const deleteUjian = async (req, res, next) => {
  try {
    await svc.deleteUjian(req.params.id);
    res.json({ success: true, message: 'Ujian berhasil dihapus.' });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const VALID = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
    const { status } = req.body;
    if (!VALID.includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    const data = await svc.updateStatusUjian(req.params.id, status);
    res.json({ success: true, message: `Ujian berhasil diubah ke ${status}.`, data });
  } catch (err) { next(err); }
};

const listSoal = async (req, res, next) => {
  try {
    const data = await svc.listSoal(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createSoal = async (req, res, next) => {
  try {
    const { teks, pilihanA, pilihanB, pilihanC, pilihanD, kunciJawaban, bobot, urutan } = req.body;
    const data = await svc.createSoal(req.params.id, {
      teks, pilihanA, pilihanB, pilihanC, pilihanD,
      kunciJawaban: String(kunciJawaban).toUpperCase(),
      bobot: Number(bobot ?? 1),
      ...(urutan !== undefined && { urutan: Number(urutan) }),
    });
    res.status(201).json({ success: true, message: 'Soal berhasil ditambahkan.', data });
  } catch (err) { next(err); }
};

const updateSoal = async (req, res, next) => {
  try {
    const { teks, pilihanA, pilihanB, pilihanC, pilihanD, kunciJawaban, bobot, urutan } = req.body;
    const data = await svc.updateSoal(req.params.soalId, {
      ...(teks !== undefined && { teks }),
      ...(pilihanA !== undefined && { pilihanA }),
      ...(pilihanB !== undefined && { pilihanB }),
      ...(pilihanC !== undefined && { pilihanC }),
      ...(pilihanD !== undefined && { pilihanD }),
      ...(kunciJawaban !== undefined && { kunciJawaban: String(kunciJawaban).toUpperCase() }),
      ...(bobot !== undefined && { bobot: Number(bobot) }),
      ...(urutan !== undefined && { urutan: Number(urutan) }),
    });
    res.json({ success: true, message: 'Soal berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const deleteSoal = async (req, res, next) => {
  try {
    await svc.deleteSoal(req.params.soalId);
    res.json({ success: true, message: 'Soal berhasil dihapus.' });
  } catch (err) { next(err); }
};

const previewImport = async (req, res, next) => {
  try {
    const rows = req.body.soal;
    if (!Array.isArray(rows) || !rows.length)
      return res.status(400).json({ success: false, message: 'Data soal tidak boleh kosong.' });
    const result = await svc.previewImport(req.params.id, rows);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const confirmImport = async (req, res, next) => {
  try {
    const rows = req.body.soal;
    if (!Array.isArray(rows) || !rows.length)
      return res.status(400).json({ success: false, message: 'Data soal tidak boleh kosong.' });
    const result = await svc.confirmImport(req.params.id, rows);
    res.json({ success: true, message: `${result.inserted} soal berhasil diimport.`, ...result });
  } catch (err) { next(err); }
};

const listPeserta = async (req, res, next) => {
  try {
    const result = await svc.listPeserta(req.params.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const rekapNilai = async (req, res, next) => {
  try {
    const result = await svc.rekapNilai(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── Publik ───────────────────────────────────────────────────────────────────

const masukUjian = async (req, res, next) => {
  try {
    const { kodeUjian, namaLengkap, identitas } = req.body;
    if (!kodeUjian?.trim() || !namaLengkap?.trim() || !identitas?.trim())
      return res.status(400).json({ success: false, message: 'Kode ujian, nama, dan identitas wajib diisi.' });
    const result = await svc.masukUjian({ kodeUjian: kodeUjian.trim(), namaLengkap: namaLengkap.trim(), identitas: identitas.trim() });
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getSesi = async (req, res, next) => {
  try {
    const data = await svc.getSesi(req.params.pesertaId);
    if (!data) return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' });
    if (data.error) return res.status(400).json({ success: false, message: data.error });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const simpanJawaban = async (req, res, next) => {
  try {
    const { soalId, jawaban } = req.body;
    if (!soalId || !jawaban)
      return res.status(400).json({ success: false, message: 'soalId dan jawaban wajib diisi.' });
    const result = await svc.simpanJawaban(req.params.pesertaId, soalId, jawaban);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const submitUjian = async (req, res, next) => {
  try {
    const result = await svc.submitUjian(req.params.pesertaId);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getHasil = async (req, res, next) => {
  try {
    const data = await svc.getHasil(req.params.pesertaId);
    if (!data) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    if (data.error) return res.status(400).json({ success: false, message: data.error });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  listUjian, createUjian, getUjian, updateUjian, deleteUjian, updateStatus,
  listSoal, createSoal, updateSoal, deleteSoal, previewImport, confirmImport,
  listPeserta, rekapNilai,
  masukUjian, getSesi, simpanJawaban, submitUjian, getHasil,
};
