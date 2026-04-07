const sosialService = require('../services/sosial.service');

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
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Foto wajib diunggah.' });
    }
    const data = {
      judul: req.body.judul,
      foto: `/uploads/sosial/${req.file.filename}`,
      kategori: req.body.kategori,
      deskripsi: req.body.deskripsi || null,
      urutan: req.body.urutan ? Number(req.body.urutan) : 0,
      tahun: req.body.tahun ? Number(req.body.tahun) : new Date().getFullYear(),
    };
    const item = await sosialService.create(data);
    res.status(201).json({ success: true, message: 'Foto berhasil ditambahkan.', data: item });
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
