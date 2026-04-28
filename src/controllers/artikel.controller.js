const artikelService = require('../services/artikel.service');

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

const parseDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};

const buildPayload = (req, { thumbnail }) => {
  const data = {
    judul: req.body.judul,
    konten: req.body.konten,
    ringkasan: req.body.ringkasan || null,
    kategori: req.body.kategori || null,
    metaTitle: req.body.metaTitle || null,
    metaDescription: req.body.metaDescription || null,
  };
  if (thumbnail !== undefined) data.thumbnail = thumbnail;
  if (req.body.isPublished !== undefined) data.isPublished = toBool(req.body.isPublished);
  if (req.body.isHighlight !== undefined) data.isHighlight = toBool(req.body.isHighlight);
  if (req.body.tanggalPublish !== undefined) {
    const d = parseDate(req.body.tanggalPublish);
    if (d) data.tanggalPublish = d;
  }
  // remove undefineds for cleanliness
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
};

const getAll = async (req, res, next) => {
  try {
    const result = await artikelService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await artikelService.getAllAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getBySlug = async (req, res, next) => {
  try {
    const artikel = await artikelService.getBySlug(req.params.slug);
    res.json({ success: true, data: artikel });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const artikel = await artikelService.getById(req.params.id);
    res.json({ success: true, data: artikel });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;
    const data = buildPayload(req, { thumbnail });
    data.createdBy = req.user.id;
    const artikel = await artikelService.create(data);
    res.status(201).json({ success: true, message: 'Artikel berhasil ditambahkan.', data: artikel });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : undefined;
    const data = buildPayload(req, { thumbnail });
    const artikel = await artikelService.update(req.params.id, data);
    res.json({ success: true, message: 'Artikel berhasil diperbarui.', data: artikel });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await artikelService.remove(req.params.id);
    res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (err) { next(err); }
};

// Inline image upload untuk rich-text editor (TipTap)
const uploadInlineImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File gambar diperlukan.' });
    }
    const url = `/uploads/galeri/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (err) { next(err); }
};

module.exports = {
  getAll, getAllAdmin, getBySlug, getById, create, update, remove, uploadInlineImage,
};
