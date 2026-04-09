const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/qurban.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { uploadQurban } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const validation = [
  body('judul').optional(),
  body('tahun').isInt({ min: 2000, max: 2100 }).withMessage('Tahun tidak valid.'),
];

router.get('/', ctrl.getAll);
router.get('/admin/all', authMiddleware, adminOnly, ctrl.getAdmin);
router.post('/', authMiddleware, adminOnly, uploadQurban.array('foto', 20), validation, validate, ctrl.create);
router.put('/:id', authMiddleware, adminOnly, uploadQurban.single('foto'), validate, ctrl.update);
router.delete('/:id', authMiddleware, adminOnly, ctrl.remove);

module.exports = router;