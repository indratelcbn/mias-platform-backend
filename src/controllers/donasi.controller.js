const donasiService = require('../services/donasi.service');

const getAll = async (req, res, next) => {
  try {
    const result = await donasiService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getRekening = async (req, res, next) => {
  try {
    const data = await donasiService.getRekening();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createRekening = async (req, res, next) => {
  try {
    const qrisImage = req.file ? `/uploads/qris/${req.file.filename}` : null;
    const data = await donasiService.createRekening({ ...req.body, qrisImage });
    res.status(201).json({ success: true, message: 'Rekening berhasil ditambahkan.', data });
  } catch (err) { next(err); }
};

const updateRekening = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) payload.qrisImage = `/uploads/qris/${req.file.filename}`;
    const data = await donasiService.updateRekening(req.params.id, payload);
    res.json({ success: true, message: 'Rekening berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const deleteRekening = async (req, res, next) => {
  try {
    await donasiService.deleteRekening(req.params.id);
    res.json({ success: true, message: 'Rekening berhasil dihapus.' });
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await donasiService.getSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const buktiTransfer = req.file ? `/uploads/bukti_transfer/${req.file.filename}` : null;
    const data = { ...req.body, jumlah: parseFloat(req.body.jumlah), buktiTransfer };
    const donasi = await donasiService.create(data);
    res.status(201).json({ success: true, message: 'Konfirmasi donasi berhasil dikirim. Terima kasih, jazakallahu khayran!', data: donasi });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const donasi = await donasiService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Status donasi diperbarui.', data: donasi });
  } catch (err) { next(err); }
};

// ─── Program Donasi ────────────────────────────────────────────────────────────
const getActiveProgram = async (req, res, next) => {
  try {
    const data = await donasiService.getActiveProgram();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAllProgram = async (req, res, next) => {
  try {
    const data = await donasiService.getAllProgram();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createProgram = async (req, res, next) => {
  try {
    const data = await donasiService.createProgram(req.body);
    res.status(201).json({ success: true, message: 'Program donasi berhasil ditambahkan.', data });
  } catch (err) { next(err); }
};

const updateProgram = async (req, res, next) => {
  try {
    const data = await donasiService.updateProgram(req.params.id, req.body);
    res.json({ success: true, message: 'Program donasi berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const deleteProgram = async (req, res, next) => {
  try {
    await donasiService.deleteProgram(req.params.id);
    res.json({ success: true, message: 'Program donasi berhasil dihapus.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getRekening, createRekening, updateRekening, deleteRekening, getSummary, create, updateStatus, getActiveProgram, getAllProgram, createProgram, updateProgram, deleteProgram };

