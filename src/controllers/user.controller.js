const userService = require('../services/user.service');

// ─── User CRUD ───────────────────────────────────────────────────────────────

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User berhasil dibuat.', data: user });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: 'User berhasil diperbarui.', data: user });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id);
    res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

// ─── Role Permissions ────────────────────────────────────────────────────────

const getRolePermissions = async (req, res, next) => {
  try {
    const permissions = await userService.getRolePermissions();
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
};

const getMyPermissions = async (req, res, next) => {
  try {
    const permissions = await userService.getPermissionsByRole(req.user.role);
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { role, menuKeys } = req.body;
    const result = await userService.updateRolePermissions(role, menuKeys);
    res.json({ success: true, message: `Permission untuk role ${role} berhasil diperbarui.`, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getRolePermissions,
  getMyPermissions,
  updateRolePermissions,
};
