const router = require('express').Router();
const { getChannelVideos } = require('../services/youtube.service');

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

module.exports = router;
