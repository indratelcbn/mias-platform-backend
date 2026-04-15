const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// ─── User CRUD ───────────────────────────────────────────────────────────────

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, username: true, nama: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, nama: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    const err = new Error('Username sudah digunakan.');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: {
      username: data.username,
      password: hashed,
      nama: data.nama,
      role: data.role || 'ADMIN',
    },
    select: { id: true, username: true, nama: true, role: true, createdAt: true },
  });
};

const updateUser = async (id, data) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  // Prevent changing the last SUPERADMIN's role
  if (user.role === 'SUPERADMIN' && data.role && data.role !== 'SUPERADMIN') {
    const superadminCount = await prisma.user.count({ where: { role: 'SUPERADMIN' } });
    if (superadminCount <= 1) {
      const err = new Error('Tidak bisa mengubah role SUPERADMIN terakhir.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.username && data.username !== user.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      const err = new Error('Username sudah digunakan.');
      err.statusCode = 409;
      throw err;
    }
  }

  const updateData = {};
  if (data.username) updateData.username = data.username;
  if (data.nama) updateData.nama = data.nama;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, nama: true, role: true, createdAt: true, updatedAt: true },
  });
};

const deleteUser = async (id, requesterId) => {
  if (id === requesterId) {
    const err = new Error('Tidak bisa menghapus akun sendiri.');
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'SUPERADMIN') {
    const superadminCount = await prisma.user.count({ where: { role: 'SUPERADMIN' } });
    if (superadminCount <= 1) {
      const err = new Error('Tidak bisa menghapus SUPERADMIN terakhir.');
      err.statusCode = 400;
      throw err;
    }
  }

  await prisma.user.delete({ where: { id } });
};

// ─── Role Permissions ────────────────────────────────────────────────────────

const getRolePermissions = async () => {
  const perms = await prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { menuKey: 'asc' }] });
  // Group by role
  const grouped = {};
  for (const p of perms) {
    if (!grouped[p.role]) grouped[p.role] = [];
    grouped[p.role].push(p.menuKey);
  }
  return grouped;
};

const getPermissionsByRole = async (role) => {
  const perms = await prisma.rolePermission.findMany({ where: { role }, select: { menuKey: true } });
  return perms.map((p) => p.menuKey);
};

const updateRolePermissions = async (role, menuKeys) => {
  // SUPERADMIN always has all permissions — cannot be modified
  if (role === 'SUPERADMIN') {
    const err = new Error('Tidak bisa mengubah permission SUPERADMIN.');
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { role } }),
    prisma.rolePermission.createMany({
      data: menuKeys.map((menuKey) => ({ role, menuKey })),
    }),
  ]);

  return menuKeys;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRolePermissions,
  getPermissionsByRole,
  updateRolePermissions,
};
