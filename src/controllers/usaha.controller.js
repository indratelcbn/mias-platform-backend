const usahaService = require('../services/usaha.service');
const { getUploadedFiles, buildBatchTitle } = require('../lib/batch-upload');

// ═══════════════════════════════════════════════════════════════════
//  UMROH
// ═══════════════════════════════════════════════════════════════════

const getUmrohPublic = async (req, res, next) => {
  try {
    const data = await usahaService.getAllUmroh({ onlyActive: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUmrohAdmin = async (req, res, next) => {
  try {
    const result = await usahaService.getAllUmrohAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createUmroh = async (req, res, next) => {
  try {
    const files = getUploadedFiles(req);
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'Flyer wajib diunggah.' });
    }
    if (files.length === 1 && !req.body.judul) {
      return res.status(400).json({ success: false, message: 'Judul program diperlukan.' });
    }
    const baseUrutan = req.body.urutan ? Number(req.body.urutan) : 0;
    const items = await Promise.all(
      files.map((file, index) => usahaService.createUmroh({
        judul: buildBatchTitle(req.body.judul, file, index, files.length),
        flyer: `/uploads/umroh/${file.filename}`,
        deskripsi: req.body.deskripsi || null,
        harga: req.body.harga ? req.body.harga : null,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
        urutan: baseUrutan + index,
      }))
    );
    res.status(201).json({
      success: true,
      message: files.length > 1 ? `${files.length} program umroh berhasil ditambahkan.` : 'Program umroh berhasil ditambahkan.',
      data: files.length > 1 ? items : items[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateUmroh = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.flyer = `/uploads/umroh/${req.file.filename}`;
    if (data.urutan !== undefined) data.urutan = Number(data.urutan);
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    if (data.harga !== undefined && data.harga !== '') {
      data.harga = data.harga;
    } else if (data.harga === '') {
      data.harga = null;
    }
    const item = await usahaService.updateUmroh(req.params.id, data);
    res.json({ success: true, message: 'Program umroh berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const removeUmroh = async (req, res, next) => {
  try {
    await usahaService.removeUmroh(req.params.id);
    res.json({ success: true, message: 'Program umroh berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  MIAS MART
// ═══════════════════════════════════════════════════════════════════

const getMartPublic = async (req, res, next) => {
  try {
    const data = await usahaService.getAllMart({ onlyActive: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getMartAdmin = async (req, res, next) => {
  try {
    const result = await usahaService.getAllMartAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createMart = async (req, res, next) => {
  try {
    const files = getUploadedFiles(req);
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'Foto produk wajib diunggah.' });
    }
    if (!req.body.harga) {
      return res.status(400).json({ success: false, message: 'Harga produk diperlukan.' });
    }
    if (files.length === 1 && !req.body.nama) {
      return res.status(400).json({ success: false, message: 'Nama produk diperlukan.' });
    }
    const baseUrutan = req.body.urutan ? Number(req.body.urutan) : 0;
    const items = await Promise.all(
      files.map((file, index) => usahaService.createMart({
        nama: buildBatchTitle(req.body.nama, file, index, files.length),
        foto: `/uploads/mart/${file.filename}`,
        harga: req.body.harga,
        deskripsi: req.body.deskripsi || null,
        linkBeli: req.body.linkBeli || null,
        stok: req.body.stok || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
        urutan: baseUrutan + index,
      }))
    );
    res.status(201).json({
      success: true,
      message: files.length > 1 ? `${files.length} produk berhasil ditambahkan.` : 'Produk berhasil ditambahkan.',
      data: files.length > 1 ? items : items[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateMart = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.foto = `/uploads/mart/${req.file.filename}`;
    if (data.urutan !== undefined) data.urutan = Number(data.urutan);
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    const item = await usahaService.updateMart(req.params.id, data);
    res.json({ success: true, message: 'Produk berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const removeMart = async (req, res, next) => {
  try {
    await usahaService.removeMart(req.params.id);
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUmrohPublic, getUmrohAdmin, createUmroh, updateUmroh, removeUmroh,
  getMartPublic, getMartAdmin, createMart, updateMart, removeMart,
};
