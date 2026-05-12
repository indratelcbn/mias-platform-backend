const divisiService = require('../services/divisi.service');

const getAll = async (req, res, next) => {
  try {
    const result = await divisiService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getActive = async (req, res, next) => {
  try {
    const data = await divisiService.getActive();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await divisiService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await divisiService.create(req.body);
    res.status(201).json({ success: true, message: 'Divisi berhasil ditambahkan.', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await divisiService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Divisi berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const delete_ = async (req, res, next) => {
  try {
    await divisiService.delete(req.params.id);
    res.json({ success: true, message: 'Divisi berhasil dihapus.' });
  } catch (err) { next(err); }
};

const reorder = async (req, res, next) => {
  try {
    const result = await divisiService.reorder(req.body.orders);
    res.json({ success: true, message: 'Urutan divisi berhasil diperbarui.', data: result });
  } catch (err) { next(err); }
};

module.exports = { getAll, getActive, getById, create, update, delete: delete_, reorder };
