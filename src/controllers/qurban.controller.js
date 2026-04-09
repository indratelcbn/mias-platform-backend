const qurbanService = require('../services/qurban.service');
const { getUploadedFiles, buildBatchTitle } = require('../lib/batch-upload');

const getAll = async (req, res, next) => {
  try {
    const data = await qurbanService.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAdmin = async (req, res, next) => {
  try {
    const result = await qurbanService.getAdmin(req.query);
    res.json({ success: true, ...result });
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

    const baseUrutan = Number(req.body.urutan) || 0;
    const items = await Promise.all(
      files.map((file, index) => qurbanService.create({
        judul: buildBatchTitle(req.body.judul, file, index, files.length),
        foto: `/uploads/qurban/${file.filename}`,
        keterangan: req.body.keterangan || null,
        tahun: Number(req.body.tahun),
        urutan: baseUrutan + index,
      }))
    );

    res.status(201).json({
      success: true,
      message: files.length > 1 ? `${files.length} foto qurban berhasil ditambahkan.` : 'Foto qurban berhasil ditambahkan.',
      data: files.length > 1 ? items : items[0],
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const payload = {
      judul: req.body.judul,
      keterangan: req.body.keterangan !== undefined ? req.body.keterangan || null : undefined,
      tahun: req.body.tahun !== undefined ? Number(req.body.tahun) : undefined,
      urutan: req.body.urutan !== undefined ? Number(req.body.urutan) || 0 : undefined,
    };
    if (req.file) payload.foto = `/uploads/qurban/${req.file.filename}`;

    const item = await qurbanService.update(req.params.id, payload);
    res.json({ success: true, message: 'Foto qurban berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await qurbanService.remove(req.params.id);
    res.json({ success: true, message: 'Foto qurban berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getAdmin, create, update, remove };