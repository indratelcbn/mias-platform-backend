const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const kajianRoutes = require('./routes/kajian.routes');
const artikelRoutes = require('./routes/artikel.routes');
const donasiRoutes = require('./routes/donasi.routes');
const galeriRoutes = require('./routes/galeri.routes');
const streamingRoutes = require('./routes/streaming.routes');
const sosialRoutes = require('./routes/sosial.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ─── Middleware Global ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (untuk upload bukti transfer dll)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/kajian', kajianRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/donasi', donasiRoutes);
app.use('/api/galeri', galeriRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/sosial', sosialRoutes);

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
