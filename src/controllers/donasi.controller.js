const donasiService = require('../services/donasi.service');

const getAll = async (req, res, next) => {
  try {
    const result = await donasiService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getRekening = async (req, res, next) => {
  try {
    const data = await donasiService.getRekening();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await donasiService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const buktiTransfer = req.file
      ? `/uploads/bukti_transfer/${req.file.filename}`
      : null;

    const data = {
      ...req.body,
      jumlah: parseFloat(req.body.jumlah),
      buktiTransfer,
    };

    const donasi = await donasiService.create(data);
    res.status(201).json({
      success: true,
      message: 'Konfirmasi donasi berhasil dikirim. Terima kasih, jazakallahu khayran!',
      data: donasi,
    });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const donasi = await donasiService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Status donasi diperbarui.', data: donasi });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getRekening, getSummary, create, updateStatus };
