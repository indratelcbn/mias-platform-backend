const https = require('https');

// Allow self-signed / corporate proxy certs for outbound YouTube API calls only
const agent = new https.Agent({ rejectUnauthorized: false });

// Simple in-memory cache for uploads playlist ID (avoids redundant API calls)
let cachedPlaylistId = null;
let cachedChannelId  = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Live video cache — search.list costs 100 quota units/call
// 15-min cache = ~96 calls/day = 9,600 quota units (aman di bawah limit 10k)
let cachedLiveVideo = undefined; // undefined = belum fetch, null = tidak ada live
let liveCacheTime   = 0;
const LIVE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from YouTube API')); }
      });
    }).on('error', reject);
  });
}

async function getUploadsPlaylistId() {
  if (cachedPlaylistId && Date.now() - cacheTime < CACHE_TTL) {
    return cachedPlaylistId;
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
  const data = await httpsGet(url);
  if (!data.items || data.items.length === 0) {
    throw new Error('Channel YouTube tidak ditemukan');
  }
  cachedChannelId  = data.items[0].id;
  cachedPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
  cacheTime = Date.now();
  return cachedPlaylistId;
}

async function getChannelVideos({ maxResults = 20, pageToken } = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = await getUploadsPlaylistId();

  let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

  const data = await httpsGet(url);

  const videos = (data.items || []).map((item) => {
    const snip = item.snippet;
    return {
      videoId:     snip.resourceId.videoId,
      title:       snip.title,
      description: snip.description,
      thumbnail:   snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url || '',
      publishedAt: snip.publishedAt,
      url:         `https://www.youtube.com/watch?v=${snip.resourceId.videoId}`,
      embedUrl:    `https://www.youtube.com/embed/${snip.resourceId.videoId}`,
    };
  });

  return {
    videos,
    nextPageToken: data.nextPageToken || null,
    prevPageToken: data.prevPageToken || null,
    totalResults:  data.pageInfo?.totalResults || 0,
  };
}

async function getLiveVideo() {
  if (cachedLiveVideo !== undefined && Date.now() - liveCacheTime < LIVE_CACHE_TTL) {
    return cachedLiveVideo;
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  // Pastikan cachedChannelId terisi
  await getUploadsPlaylistId();
  if (!cachedChannelId) {
    cachedLiveVideo = null;
    liveCacheTime = Date.now();
    return null;
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${cachedChannelId}&eventType=live&type=video&key=${apiKey}`;
  const data = await httpsGet(url);
  if (!data.items || data.items.length === 0) {
    cachedLiveVideo = null;
    liveCacheTime = Date.now();
    return null;
  }
  const item = data.items[0];
  cachedLiveVideo = {
    videoId:   item.id.videoId,
    title:     item.snippet.title,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
    embedUrl:  `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1`,
  };
  liveCacheTime = Date.now();
  return cachedLiveVideo;
}

module.exports = { getChannelVideos, getLiveVideo };
