const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/pesan.controller');
const validate = require('../middleware/validate.middleware');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

router.post(
  '/',
  [
    body('nama').notEmpty().withMessage('Nama harus diisi.'),
    body('email').notEmpty().withMessage('Email harus diisi.').isEmail().withMessage('Email tidak valid.'),
    body('noHp').notEmpty().withMessage('No. Handphone harus diisi.'),
    body('kategori')
      .isIn([
        'FASILITAS',
        'DIVISI_DAKWAH',
        'DIVISI_PENDIDIKAN',
        'DIVISI_SOSIAL',
        'UMROH',
        'PEMBELIAN_PRODUK_MIAS_MART',
        'LAIN_LAIN',
      ])
      .withMessage('Kategori pesan tidak valid.'),
    body('pesan').notEmpty().withMessage('Pesan harus diisi.'),
  ],
  validate,
  ctrl.create
);

router.get('/summary', authMiddleware, adminOnly, ctrl.getSummary);
router.get('/', authMiddleware, adminOnly, ctrl.getAll);
router.put(
  '/:id/status',
  authMiddleware,
  adminOnly,
  [body('status').isIn(['BELUM_DITINDAKLANJUTI', 'SUDAH_DITINDAKLANJUTI']).withMessage('Status pesan tidak valid.')],
  validate,
  ctrl.updateStatus
);

module.exports = router;
