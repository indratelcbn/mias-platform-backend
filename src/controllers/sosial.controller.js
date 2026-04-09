const sosialService = require('../services/sosial.service');
const { getUploadedFiles, buildBatchTitle } = require('../lib/batch-upload');

const getByKategori = async (req, res, next) => {
  try {
    const { kategori } = req.params;
    const [data, availableYears] = await Promise.all([
      sosialService.getByKategori(kategori),
      sosialService.getYearsByKategori(kategori),
    ]);
    res.json({ success: true, data, availableYears });
  } catch (err) {
    next(err);
  }
};

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await sosialService.getAllAdmin(req.query);
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
    const baseUrutan = req.body.urutan ? Number(req.body.urutan) : 0;
    const items = await Promise.all(
      files.map((file, index) => sosialService.create({
        judul: buildBatchTitle(req.body.judul, file, index, files.length),
        foto: `/uploads/sosial/${file.filename}`,
        kategori: req.body.kategori,
        deskripsi: req.body.deskripsi || null,
        urutan: baseUrutan + index,
        tahun: req.body.tahun ? Number(req.body.tahun) : new Date().getFullYear(),
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
    if (req.file) data.foto = `/uploads/sosial/${req.file.filename}`;
    if (data.urutan !== undefined) data.urutan = Number(data.urutan);
    if (data.tahun !== undefined) data.tahun = Number(data.tahun);
    const item = await sosialService.update(req.params.id, data);
    res.json({ success: true, message: 'Foto berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await sosialService.remove(req.params.id);
    res.json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getByKategori, getAllAdmin, create, update, remove };
