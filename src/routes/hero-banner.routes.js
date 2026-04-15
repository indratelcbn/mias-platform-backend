const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadHeroBanner } = require('../middleware/upload.middleware');
const ctrl = require('../controllers/hero-banner.controller');

// Public — active banners for homepage
router.get('/public', ctrl.listPublic);

// Admin — CRUD
router.get('/', authMiddleware, ctrl.listAll);
router.post('/', authMiddleware, uploadHeroBanner.single('gambar'), ctrl.create);
router.put('/:id', authMiddleware, uploadHeroBanner.single('gambar'), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
