const pendidikanService = require('../services/pendidikan.service');
const { getUploadedFiles, buildBatchTitle } = require('../lib/batch-upload');

// ─── Public: get full data for one kategori ────────────────────────────────────
const getByKategori = async (req, res, next) => {
  try {
    const { kategori } = req.params;
    const [info, fotos, availableYears] = await Promise.all([
      pendidikanService.getInfoByKategori(kategori),
      pendidikanService.getFotoByKategori(kategori),
      pendidikanService.getYearsByKategori(kategori),
    ]);
    res.json({ success: true, info, fotos, availableYears });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: get all info records ───────────────────────────────────────────────
const getAllInfo = async (req, res, next) => {
  try {
    const data = await pendidikanService.getAllInfo();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: upsert info for a kategori ───────────────────────────────────────
const upsertInfo = async (req, res, next) => {
  try {
    const { kategori } = req.params;
    const { pengajar, jumlahPenuntutIlmu, kitab, deskripsi } = req.body;
    const data = {
      pengajar: pengajar || '[]',
      jumlahPenuntutIlmu: jumlahPenuntutIlmu ? Number(jumlahPenuntutIlmu) : 0,
      kitab: kitab || '[]',
      deskripsi: deskripsi || null,
    };
    const item = await pendidikanService.upsertInfo(kategori, data);
    res.json({ success: true, message: 'Info pendidikan berhasil disimpan.', data: item });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: get all fotos (paginated) ─────────────────────────────────────────
const getAllFotoAdmin = async (req, res, next) => {
  try {
    const result = await pendidikanService.getAllFotoAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: create foto ────────────────────────────────────────────────────────
const createFoto = async (req, res, next) => {
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
      files.map((file, index) => pendidikanService.createFoto({
        kategori: req.body.kategori,
        judul: buildBatchTitle(req.body.judul, file, index, files.length),
        foto: `/uploads/pendidikan/${file.filename}`,
        keterangan: req.body.keterangan || null,
        tahun: req.body.tahun ? Number(req.body.tahun) : new Date().getFullYear(),
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

// ─── Admin: update foto ────────────────────────────────────────────────────────
const updateFoto = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.foto = `/uploads/pendidikan/${req.file.filename}`;
    if (data.tahun !== undefined) data.tahun = Number(data.tahun);
    if (data.urutan !== undefined) data.urutan = Number(data.urutan);
    if (data.jumlahPenuntutIlmu !== undefined) data.jumlahPenuntutIlmu = Number(data.jumlahPenuntutIlmu);
    const item = await pendidikanService.updateFoto(req.params.id, data);
    res.json({ success: true, message: 'Foto berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: delete foto ────────────────────────────────────────────────────────
const removeFoto = async (req, res, next) => {
  try {
    await pendidikanService.removeFoto(req.params.id);
    res.json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getByKategori, getAllInfo, upsertInfo, getAllFotoAdmin, createFoto, updateFoto, removeFoto };
