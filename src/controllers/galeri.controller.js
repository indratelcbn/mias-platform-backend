const galeriService = require('../services/galeri.service');
const { getUploadedFiles, buildBatchTitle } = require('../lib/batch-upload');

const getAll = async (req, res, next) => {
  try {
    const data = await galeriService.getAll({ kategori: req.query.kategori, tahun: req.query.tahun });
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
    const files = getUploadedFiles(req);
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'Foto wajib diunggah.' });
    }
    if (files.length === 1 && !req.body.judul) {
      return res.status(400).json({ success: false, message: 'Judul foto diperlukan.' });
    }

    const baseUrutan = req.body.urutan !== undefined ? Number(req.body.urutan) : 0;
    const items = await Promise.all(
      files.map((file, index) => galeriService.create({
        judul: buildBatchTitle(req.body.judul, file, index, files.length),
        foto: `/uploads/galeri/${file.filename}`,
        kategori: req.body.kategori,
        keterangan: req.body.keterangan || null,
        tahun: Number(req.body.tahun),
        urutan: baseUrutan + index,
      }))
    );

    res.status(201).json({
      success: true,
      message: files.length > 1 ? `${files.length} foto berhasil ditambahkan.` : 'Foto berhasil ditambahkan.',
      data: files.length > 1 ? items : items[0],
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.tahun !== undefined) data.tahun = Number(data.tahun);
    if (data.urutan !== undefined) data.urutan = Number(data.urutan);
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
