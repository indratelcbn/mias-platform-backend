
const streamingService = require('../services/streaming.service');
const { getLiveVideo } = require('../services/youtube.service');


// Endpoint: GET /api/streaming/active
// Cek status live streaming langsung ke YouTube API
const getActive = async (req, res, next) => {
  try {
    const live = await getLiveVideo();
    if (!live) {
      return res.json({ success: true, data: null });
    }
    // Format respons agar kompatibel dengan frontend
    res.json({
      success: true,
      data: {
        judul: live.title,
        url: `https://www.youtube.com/watch?v=${live.videoId}`,
        deskripsi: '',
        isLive: true,
        thumbnail: live.thumbnail,
        embedUrl: live.embedUrl,
        startedAt: null,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const data = await streamingService.getAll();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await streamingService.getById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = {
      judul: req.body.judul,
      url: req.body.url,
      deskripsi: req.body.deskripsi || null,
      isLive: req.body.isLive === 'true' || req.body.isLive === true || false,
    };
    const item = await streamingService.create(data);
    res.status(201).json({ success: true, message: 'Streaming berhasil ditambahkan.', data: item });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.body.isLive !== undefined) {
      data.isLive = req.body.isLive === 'true' || req.body.isLive === true;
    }
    const item = await streamingService.update(req.params.id, data);
    res.json({ success: true, message: 'Streaming berhasil diperbarui.', data: item });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await streamingService.remove(req.params.id);
    res.json({ success: true, message: 'Streaming berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

const setLive = async (req, res, next) => {
  try {
    const item = await streamingService.setLive(req.params.id);
    res.json({ success: true, message: 'Streaming diaktifkan sebagai live.', data: item });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActive, getAll, getById, create, update, remove, setLive };
