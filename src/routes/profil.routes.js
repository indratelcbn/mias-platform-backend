const router = require('express').Router();
const ctrl = require('../controllers/profil.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadProfilFoto, uploadFasilitas } = require('../middleware/upload.middleware');

// ─── Sejarah ──────────────────────────────────────────────────────────────────
router.get('/sejarah',     ctrl.getSejarah);
router.put('/sejarah',     authMiddleware, uploadProfilFoto.single('foto'), ctrl.updateSejarah);

// ─── Visi Misi ────────────────────────────────────────────────────────────────
router.get('/visi-misi',   ctrl.getVisiMisi);
router.put('/visi-misi',   authMiddleware, ctrl.updateVisiMisi);

// ─── Fasilitas ────────────────────────────────────────────────────────────────
router.get('/fasilitas',          ctrl.getFasilitasPublic);
router.get('/fasilitas/admin',    authMiddleware, ctrl.getFasilitasAdmin);
router.post('/fasilitas',         authMiddleware, ctrl.createFasilitas);
router.put('/fasilitas/:id',      authMiddleware, ctrl.updateFasilitas);
router.delete('/fasilitas/:id',   authMiddleware, ctrl.deleteFasilitas);

// Fasilitas foto management
router.post('/fasilitas/:id/foto',         authMiddleware, uploadFasilitas.single('foto'), ctrl.addFasilitasFoto);
router.delete('/fasilitas/foto/:fotoId',   authMiddleware, ctrl.deleteFasilitasFoto);

// ─── Struktur Organisasi ──────────────────────────────────────────────────────
router.get('/struktur',    ctrl.getStruktur);
router.put('/struktur',    authMiddleware, uploadProfilFoto.single('foto'), ctrl.updateStruktur);

// ─── Pemateri ─────────────────────────────────────────────────────────────────
router.get('/pemateri',          ctrl.getPemateriPublic);
router.get('/pemateri/admin',    authMiddleware, ctrl.getPemateriAdmin);
router.post('/pemateri',         authMiddleware, uploadProfilFoto.single('foto'), ctrl.createPemateri);
router.put('/pemateri/:id',      authMiddleware, uploadProfilFoto.single('foto'), ctrl.updatePemateri);
router.delete('/pemateri/:id',   authMiddleware, ctrl.deletePemateri);

// ─── Hero Stats (public) ──────────────────────────────────────────────────────
router.get('/hero-stats',        ctrl.getHeroStats);

module.exports = router;
