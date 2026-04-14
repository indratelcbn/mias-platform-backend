const router = require('express').Router();
const { body } = require('express-validator');
const mustahikController = require('../controllers/mustahik.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const VALID_KATEGORI = ['YATIM', 'JANDA', 'FAKIR', 'MISKIN', 'GHARIM', 'FII_SABILILLAH', 'MUSAFIR'];
const VALID_BERHAK = ['PENERIMA_ZAKAT_MAL', 'PENERIMA_ZAKAT_FITRI', 'PENERIMA_BANTUAN_MIAS', 'SEMUA'];

// All routes are admin-only
router.get('/', authMiddleware, adminOnly, mustahikController.getAll);
router.get('/export', authMiddleware, adminOnly, mustahikController.exportData);

router.post(
  '/',
  authMiddleware, adminOnly,
  [
    body('nama').notEmpty().withMessage('Nama mustahik diperlukan.'),
    body('kategori').isIn(VALID_KATEGORI).withMessage('Kategori tidak valid.'),
    body('berhak').optional().isIn(VALID_BERHAK).withMessage('Hak penerima tidak valid.'),
  ],
  validate,
  mustahikController.create
);

router.post('/import', authMiddleware, adminOnly, mustahikController.importData);

router.put(
  '/:id',
  authMiddleware, adminOnly,
  [
    body('nama').optional().notEmpty().withMessage('Nama mustahik tidak boleh kosong.'),
    body('kategori').optional().isIn(VALID_KATEGORI).withMessage('Kategori tidak valid.'),
    body('berhak').optional().isIn(VALID_BERHAK).withMessage('Hak penerima tidak valid.'),
  ],
  validate,
  mustahikController.update
);

router.delete('/:id', authMiddleware, adminOnly, mustahikController.remove);

module.exports = router;
