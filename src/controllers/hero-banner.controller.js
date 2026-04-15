const heroBannerService = require('../services/hero-banner.service');

async function listPublic(req, res, next) {
  try {
    const banners = await heroBannerService.listActive();
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const banners = await heroBannerService.list();
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File gambar wajib diupload' });
    }
    const data = {
      gambar: req.file.filename,
      urutan: parseInt(req.body.urutan, 10) || 0,
      isActive: req.body.isActive !== 'false',
    };
    const banner = await heroBannerService.create(data);
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = {};
    if (req.body.urutan !== undefined) data.urutan = parseInt(req.body.urutan, 10);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.file) data.gambar = req.file.filename;
    const banner = await heroBannerService.update(req.params.id, data);
    res.json({ success: true, data: banner });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await heroBannerService.remove(req.params.id);
    res.json({ success: true, message: 'Banner berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPublic, listAll, create, update, remove };
