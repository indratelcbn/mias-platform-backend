const pesanService = require('../services/pesan.service');

const create = async (req, res, next) => {
  try {
    const data = await pesanService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Pesan berhasil dikirim. Terima kasih, insyaAllah segera kami tindak lanjuti.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const data = await pesanService.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await pesanService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await pesanService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Status pesan diperbarui.', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getSummary, updateStatus };
