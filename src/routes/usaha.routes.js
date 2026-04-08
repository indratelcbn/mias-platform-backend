const router = require('express').Router();
const { body } = require('express-validator');
const usahaController = require('../controllers/usaha.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadUmroh, uploadMart } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

// ═══════════════════════════════════════════════════════════════════
//  UMROH
// ═══════════════════════════════════════════════════════════════════

const umrohCreateValidation = [
  body('judul').notEmpty().withMessage('Judul program diperlukan.'),
];

// GET /api/usaha/umroh/admin
router.get('/umroh/admin', authMiddleware, adminOnly, usahaController.getUmrohAdmin);

// POST /api/usaha/umroh
router.post(
  '/umroh',
  authMiddleware,
  adminOnly,
  uploadUmroh.single('flyer'),
  umrohCreateValidation,
  validate,
  usahaController.createUmroh
);

// PUT /api/usaha/umroh/:id
router.put(
  '/umroh/:id',
  authMiddleware,
  adminOnly,
  uploadUmroh.single('flyer'),
  validate,
  usahaController.updateUmroh
);

// DELETE /api/usaha/umroh/:id
router.delete('/umroh/:id', authMiddleware, adminOnly, usahaController.removeUmroh);

// GET /api/usaha/umroh  (public)
router.get('/umroh', usahaController.getUmrohPublic);

// ═══════════════════════════════════════════════════════════════════
//  MIAS MART
// ═══════════════════════════════════════════════════════════════════

const martCreateValidation = [
  body('nama').notEmpty().withMessage('Nama produk diperlukan.'),
  body('harga').notEmpty().withMessage('Harga produk diperlukan.').isNumeric().withMessage('Harga harus berupa angka.'),
];

// GET /api/usaha/mart/admin
router.get('/mart/admin', authMiddleware, adminOnly, usahaController.getMartAdmin);

// POST /api/usaha/mart
router.post(
  '/mart',
  authMiddleware,
  adminOnly,
  uploadMart.single('foto'),
  martCreateValidation,
  validate,
  usahaController.createMart
);

// PUT /api/usaha/mart/:id
router.put(
  '/mart/:id',
  authMiddleware,
  adminOnly,
  uploadMart.single('foto'),
  validate,
  usahaController.updateMart
);

// DELETE /api/usaha/mart/:id
router.delete('/mart/:id', authMiddleware, adminOnly, usahaController.removeMart);

// GET /api/usaha/mart  (public)
router.get('/mart', usahaController.getMartPublic);

module.exports = router;
