const kajianService = require('../services/kajian.service');
const path = require('path');

const getAll = async (req, res, next) => {
  try {
    const result = await kajianService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await kajianService.getAllAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const kajian = await kajianService.getById(req.params.id);
    res.json({ success: true, data: kajian });
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
      tanggal: new Date(req.body.tanggal),
      thumbnail,
      createdBy: req.user.id,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished === 'true' : true,
    };

    const kajian = await kajianService.create(data);
    res.status(201).json({ success: true, message: 'Kajian berhasil ditambahkan.', data: kajian });
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
    if (req.body.tanggal) data.tanggal = new Date(req.body.tanggal);
    if (thumbnail) data.thumbnail = thumbnail;
    if (req.body.isPublished !== undefined) {
      data.isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;
    }

    const kajian = await kajianService.update(req.params.id, data);
    res.json({ success: true, message: 'Kajian berhasil diperbarui.', data: kajian });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await kajianService.remove(req.params.id);
    res.json({ success: true, message: 'Kajian berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
