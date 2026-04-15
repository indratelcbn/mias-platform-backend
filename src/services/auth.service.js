const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const login = async (username, password) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    const err = new Error('Username atau password salah.');
    err.statusCode = 401;
    throw err;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const err = new Error('Username atau password salah.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Fetch role permissions
  const perms = await prisma.rolePermission.findMany({
    where: { role: user.role },
    select: { menuKey: true },
  });
  const permissions = perms.map((p) => p.menuKey);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      permissions,
    },
  };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, nama: true, role: true, createdAt: true },
  });

  if (!user) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const perms = await prisma.rolePermission.findMany({
    where: { role: user.role },
    select: { menuKey: true },
  });
  user.permissions = perms.map((p) => p.menuKey);

  return user;
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    const err = new Error('Password lama tidak sesuai.');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

module.exports = { login, getProfile, changePassword };
