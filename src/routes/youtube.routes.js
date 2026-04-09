const router = require('express').Router();
const { getChannelVideos, getLiveVideo } = require('../services/youtube.service');

// GET /api/youtube/videos?maxResults=12&pageToken=...
router.get('/videos', async (req, res, next) => {
  try {
    const maxResults = Math.min(parseInt(req.query.maxResults) || 12, 50);
    const pageToken  = req.query.pageToken || undefined;
    const result = await getChannelVideos({ maxResults, pageToken });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/youtube/live — deteksi siaran langsung dari channel (cache 15 menit)
router.get('/live', async (req, res, next) => {
  try {
    const live = await getLiveVideo();
    res.json({ success: true, data: live }); // data: null jika tidak ada live
  } catch (err) {
    next(err);
  }
});

module.exports = router;
