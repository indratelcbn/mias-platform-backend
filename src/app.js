const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');

const authRoutes = require('./routes/auth.routes');
const kajianRoutes = require('./routes/kajian.routes');
const artikelRoutes = require('./routes/artikel.routes');
const donasiRoutes = require('./routes/donasi.routes');
const galeriRoutes = require('./routes/galeri.routes');
const streamingRoutes = require('./routes/streaming.routes');
const sosialRoutes = require('./routes/sosial.routes');
const pendidikanRoutes = require('./routes/pendidikan.routes');
const usahaRoutes = require('./routes/usaha.routes');
const settingRoutes = require('./routes/setting.routes');
const youtubeRoutes = require('./routes/youtube.routes');
const profilRoutes  = require('./routes/profil.routes');
const pesanRoutes = require('./routes/pesan.routes');
const qurbanRoutes = require('./routes/qurban.routes');
const mustahikRoutes = require('./routes/mustahik.routes');
const userRoutes = require('./routes/user.routes');
const heroBannerRoutes = require('./routes/hero-banner.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Khusus login — maks 5 percobaan per 5 menit per IP (backup, selain per-username)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login dari IP ini. Coba lagi dalam 5 menit.' },
});

// Semua API umum — maks 300 request per menit per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
});

// ─── Middleware Global ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger UI (development) ─────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "MIAS API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

// Static files (untuk upload bukti transfer dll)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/kajian', kajianRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/donasi', donasiRoutes);
app.use('/api/galeri', galeriRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/sosial', sosialRoutes);
app.use('/api/pendidikan', pendidikanRoutes);
app.use('/api/usaha', usahaRoutes);
app.use('/api/setting', settingRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/profil',  profilRoutes);
app.use('/api/pesan', pesanRoutes);
app.use('/api/qurban', qurbanRoutes);
app.use('/api/mustahik', mustahikRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hero-banner', heroBannerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: "Masjid Imam Asy Syafi'i Depok API" });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
