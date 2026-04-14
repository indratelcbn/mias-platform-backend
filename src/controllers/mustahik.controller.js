const mustahikService = require('../services/mustahik.service');

const VALID_KATEGORI = ['YATIM', 'JANDA', 'FAKIR', 'MISKIN', 'GHARIM', 'FII_SABILILLAH', 'MUSAFIR'];
const VALID_BERHAK = ['PENERIMA_ZAKAT_MAL', 'PENERIMA_ZAKAT_FITRI', 'PENERIMA_BANTUAN_MIAS', 'SEMUA'];

const getAll = async (req, res, next) => {
  try {
    const result = await mustahikService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await mustahikService.create(req.body);
    res.status(201).json({ success: true, message: 'Data mustahik berhasil ditambahkan.', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await mustahikService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Data mustahik berhasil diperbarui.', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await mustahikService.remove(req.params.id);
    res.json({ success: true, message: 'Data mustahik berhasil dihapus.' });
  } catch (err) { next(err); }
};

const importData = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || !records.length) {
      return res.status(400).json({ success: false, message: 'Data import tidak boleh kosong.' });
    }
    // Validate each record
    const cleaned = records.map((r, i) => {
      if (!r.nama) throw Object.assign(new Error(`Baris ${i + 1}: Nama wajib diisi.`), { statusCode: 400 });
      if (!VALID_KATEGORI.includes(r.kategori)) throw Object.assign(new Error(`Baris ${i + 1}: Kategori tidak valid.`), { statusCode: 400 });
      return {
        nama: r.nama,
        alamat: r.alamat || null,
        kabKota: r.kabKota || null,
        provinsi: r.provinsi || null,
        telepon: r.telepon || null,
        kategori: r.kategori,
        berhak: VALID_BERHAK.includes(r.berhak) ? r.berhak : 'SEMUA',
      };
    });
    const result = await mustahikService.createMany(cleaned);
    res.status(201).json({ success: true, message: `${result.count} data mustahik berhasil diimpor.`, data: result });
  } catch (err) { next(err); }
};

const exportData = async (req, res, next) => {
  try {
    const data = await mustahikService.exportAll(req.query);
    // Return as JSON array (frontend will convert to CSV)
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, importData, exportData };
