const svc = require('../services/profil.service');

// ─── Sejarah ──────────────────────────────────────────────────────────────────
async function getSejarah(req, res, next) {
  try { res.json({ success: true, data: await svc.getSejarah() }); }
  catch (err) { next(err); }
}

async function updateSejarah(req, res, next) {
  try {
    const data = {};
    if (req.body.konten !== undefined) data.konten = req.body.konten || null;
    const row = await svc.updateSejarah(data, req.file?.filename);
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// ─── Visi Misi ────────────────────────────────────────────────────────────────
async function getVisiMisi(req, res, next) {
  try { res.json({ success: true, data: await svc.getVisiMisi() }); }
  catch (err) { next(err); }
}

async function updateVisiMisi(req, res, next) {
  try {
    const data = {};
    if (req.body.visi !== undefined) data.visi = req.body.visi || null;
    if (req.body.misi !== undefined) data.misi = req.body.misi || null;
    res.json({ success: true, data: await svc.updateVisiMisi(data) });
  } catch (err) { next(err); }
}

// ─── Fasilitas ────────────────────────────────────────────────────────────────
async function getFasilitasPublic(req, res, next) {
  try { res.json({ success: true, data: await svc.getAllFasilitas({ onlyActive: true }) }); }
  catch (err) { next(err); }
}

async function getFasilitasAdmin(req, res, next) {
  try { res.json({ success: true, data: await svc.getAllFasilitas() }); }
  catch (err) { next(err); }
}

async function getFasilitasById(req, res, next) {
  try { res.json({ success: true, data: await svc.getFasilitasById(req.params.id) }); }
  catch (err) { next(err); }
}

async function createFasilitas(req, res, next) {
  try {
    const row = await svc.createFasilitas({
      judul:     req.body.judul,
      deskripsi: req.body.deskripsi || null,
      urutan:    Number(req.body.urutan) || 0,
      isActive:  req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

async function updateFasilitas(req, res, next) {
  try {
    const data = {};
    if (req.body.judul     !== undefined) data.judul     = req.body.judul;
    if (req.body.deskripsi !== undefined) data.deskripsi = req.body.deskripsi || null;
    if (req.body.urutan    !== undefined) data.urutan    = Number(req.body.urutan) || 0;
    if (req.body.isActive  !== undefined) data.isActive  = req.body.isActive === 'true' || req.body.isActive === true;
    res.json({ success: true, data: await svc.updateFasilitas(req.params.id, data) });
  } catch (err) { next(err); }
}

async function deleteFasilitas(req, res, next) {
  try { await svc.deleteFasilitas(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

async function addFasilitasFoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Foto wajib diunggah.' });
    const fasilitas = await svc.getFasilitasById(req.params.id);
    if (fasilitas.foto.length >= 6) {
      return res.status(400).json({ success: false, message: 'Maksimal 6 foto per fasilitas.' });
    }
    const row = await svc.addFasilitasFoto(req.params.id, req.file.filename, req.body.caption, req.body.urutan);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

async function deleteFasilitasFoto(req, res, next) {
  try { await svc.deleteFasilitasFoto(req.params.fotoId); res.json({ success: true }); }
  catch (err) { next(err); }
}

// ─── Struktur ─────────────────────────────────────────────────────────────────
async function getStruktur(req, res, next) {
  try { res.json({ success: true, data: await svc.getStruktur() }); }
  catch (err) { next(err); }
}

async function updateStruktur(req, res, next) {
  try {
    const data = {};
    if (req.body.keterangan !== undefined) data.keterangan = req.body.keterangan || null;
    res.json({ success: true, data: await svc.updateStruktur(data, req.file?.filename) });
  } catch (err) { next(err); }
}

// ─── Pemateri ─────────────────────────────────────────────────────────────────
async function getPemateriPublic(req, res, next) {
  try { res.json({ success: true, data: await svc.getAllPemateri({ onlyActive: true }) }); }
  catch (err) { next(err); }
}

async function getPemateriAdmin(req, res, next) {
  try { res.json({ success: true, data: await svc.getAllPemateri() }); }
  catch (err) { next(err); }
}

async function createPemateri(req, res, next) {
  try {
    const data = {
      nama:       req.body.nama,
      kitab:      req.body.kitab   || null,
      jenis:      req.body.jenis   || 'RUTIN',
      waktu:      req.body.waktu   || null,
      jam:        req.body.jam     || null,
      keterangan: req.body.keterangan || null,
      urutan:     Number(req.body.urutan) || 0,
      isActive:   req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
    };
    const row = await svc.createPemateri(data, req.file?.filename);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
}

async function updatePemateri(req, res, next) {
  try {
    const data = {};
    if (req.body.nama       !== undefined) data.nama       = req.body.nama;
    if (req.body.kitab      !== undefined) data.kitab      = req.body.kitab      || null;
    if (req.body.jenis      !== undefined) data.jenis      = req.body.jenis;
    if (req.body.waktu      !== undefined) data.waktu      = req.body.waktu      || null;
    if (req.body.jam        !== undefined) data.jam        = req.body.jam        || null;
    if (req.body.keterangan !== undefined) data.keterangan = req.body.keterangan || null;
    if (req.body.urutan     !== undefined) data.urutan     = Number(req.body.urutan) || 0;
    if (req.body.isActive   !== undefined) data.isActive   = req.body.isActive === 'true' || req.body.isActive === true;
    const row = await svc.updatePemateri(req.params.id, data, req.file?.filename);
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

async function deletePemateri(req, res, next) {
  try { await svc.deletePemateri(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = {
  getSejarah, updateSejarah,
  getVisiMisi, updateVisiMisi,
  getFasilitasPublic, getFasilitasAdmin, getFasilitasById, createFasilitas, updateFasilitas, deleteFasilitas,
  addFasilitasFoto, deleteFasilitasFoto,
  getStruktur, updateStruktur,
  getPemateriPublic, getPemateriAdmin, createPemateri, updatePemateri, deletePemateri,
};
