const router = require('express').Router();
const { body } = require('express-validator');
const divisiController = require('../controllers/divisi.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/active', divisiController.getActive);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/', authMiddleware, adminOnly, divisiController.getAll);
router.get('/:id', authMiddleware, adminOnly, divisiController.getById);

router.post(
  '/',
  authMiddleware, adminOnly,
  [
    body('nama').notEmpty().withMessage('Nama divisi diperlukan.'),
    body('deskripsi').optional({ values: 'falsy' }).isString(),
  ],
  validate,
  divisiController.create
);

router.put(
  '/:id',
  authMiddleware, adminOnly,
  [
    body('nama').optional().isString().notEmpty(),
    body('deskripsi').optional({ values: 'falsy' }).isString(),
    body('isActive').optional().isBoolean(),
    body('urutan').optional().isInt(),
  ],
  validate,
  divisiController.update
);

router.delete('/:id', authMiddleware, adminOnly, divisiController.delete);

// Bulk reorder
router.post(
  '/reorder',
  authMiddleware, adminOnly,
  [
    body('orders').isArray().withMessage('Orders harus berupa array.'),
    body('orders.*.id').notEmpty(),
    body('orders.*.urutan').isInt(),
  ],
  validate,
  divisiController.reorder
);

module.exports = router;
