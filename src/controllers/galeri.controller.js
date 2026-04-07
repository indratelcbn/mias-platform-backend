const galeriService = require('../services/galeri.service');

const getAll = async (req, res, next) => {
  try {
    const data = await galeriService.getAll({ kategori: req.query.kategori });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await galeriService.getAllAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await galeriService.getById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Foto wajib diunggah.' });
    }
    const data = {
      judul: req.body.judul,
      foto: `/uploads/galeri/${req.file.filename}`,
      kategori: req.body.kategori,
      keterangan: req.body.keterangan || null,
    };
    const item = await galeriService.create(data);
    res.status(201).json({ success: true, message: 'Foto berhasil ditambahkan.', data: item });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.foto = `/uploads/galeri/${req.file.filename}`;
    const item = await galeriService.update(req.params.id, data);
    res.json({ success: true, message: 'Foto berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await galeriService.remove(req.params.id);
    res.json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
