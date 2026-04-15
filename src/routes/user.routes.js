const router = require('express').Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authMiddleware, superadminOnly } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const VALID_ROLES = ['ADMIN', 'SUPERADMIN', 'SOSIAL', 'DAKWAH', 'PENDIDIKAN', 'USAHA'];

// All routes require auth
router.use(authMiddleware);

// ─── My Permissions ──────────────────────────────────────────────────────────
// Any logged-in user can fetch their own permissions
router.get('/my-permissions', userController.getMyPermissions);

// ─── User CRUD (SUPERADMIN only) ─────────────────────────────────────────────
router.get('/', superadminOnly, userController.getAll);

router.get('/:id', superadminOnly, [
  param('id').isUUID().withMessage('ID tidak valid.'),
], validate, userController.getById);

router.post('/', superadminOnly, [
  body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter.'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('nama').trim().notEmpty().withMessage('Nama diperlukan.'),
  body('role').isIn(VALID_ROLES).withMessage('Role tidak valid.'),
], validate, userController.create);

router.put('/:id', superadminOnly, [
  param('id').isUUID().withMessage('ID tidak valid.'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter.'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('nama').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong.'),
  body('role').optional().isIn(VALID_ROLES).withMessage('Role tidak valid.'),
], validate, userController.update);

router.delete('/:id', superadminOnly, [
  param('id').isUUID().withMessage('ID tidak valid.'),
], validate, userController.remove);

// ─── Role Permissions (SUPERADMIN only) ──────────────────────────────────────
router.get('/role-permissions/all', superadminOnly, userController.getRolePermissions);

router.put('/role-permissions/update', superadminOnly, [
  body('role').isIn(VALID_ROLES).withMessage('Role tidak valid.'),
  body('menuKeys').isArray().withMessage('menuKeys harus berupa array.'),
  body('menuKeys.*').isString().withMessage('Setiap menuKey harus berupa string.'),
], validate, userController.updateRolePermissions);

module.exports = router;
