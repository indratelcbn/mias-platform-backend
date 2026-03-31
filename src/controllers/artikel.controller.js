const artikelService = require('../services/artikel.service');

const getAll = async (req, res, next) => {
  try {
    const result = await artikelService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await artikelService.getAllAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const artikel = await artikelService.getBySlug(req.params.slug);
    res.json({ success: true, data: artikel });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const artikel = await artikelService.getById(req.params.id);
    res.json({ success: true, data: artikel });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const thumbnail = req.file
      ? `/uploads/thumbnails/${req.file.filename}`
      : null;

    const data = {
      ...req.body,
      thumbnail,
      createdBy: req.user.id,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished === 'true' : true,
    };

    const artikel = await artikelService.create(data);
    res.status(201).json({ success: true, message: 'Artikel berhasil ditambahkan.', data: artikel });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const thumbnail = req.file
      ? `/uploads/thumbnails/${req.file.filename}`
      : undefined;

    const data = { ...req.body };
    if (thumbnail) data.thumbnail = thumbnail;
    if (req.body.isPublished !== undefined) {
      data.isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
    }

    const artikel = await artikelService.update(req.params.id, data);
    res.json({ success: true, message: 'Artikel berhasil diperbarui.', data: artikel });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await artikelService.remove(req.params.id);
    res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getAllAdmin, getBySlug, getById, create, update, remove };
