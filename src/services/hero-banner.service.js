const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');

const MAX_BANNERS = 5;

async function list() {
  return prisma.heroBanner.findMany({
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
}

async function listActive() {
  return prisma.heroBanner.findMany({
    where: { isActive: true },
    orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
  });
}

async function create(data) {
  const count = await prisma.heroBanner.count();
  if (count >= MAX_BANNERS) {
    const err = new Error(`Maksimal ${MAX_BANNERS} banner. Hapus salah satu terlebih dahulu.`);
    err.status = 400;
    throw err;
  }
  return prisma.heroBanner.create({ data });
}

async function update(id, data) {
  const banner = await prisma.heroBanner.findUnique({ where: { id } });
  if (!banner) {
    const err = new Error('Banner tidak ditemukan');
    err.status = 404;
    throw err;
  }
  return prisma.heroBanner.update({ where: { id }, data });
}

async function remove(id) {
  const banner = await prisma.heroBanner.findUnique({ where: { id } });
  if (!banner) {
    const err = new Error('Banner tidak ditemukan');
    err.status = 404;
    throw err;
  }
  // Delete file from disk
  const filePath = path.join(__dirname, '../../uploads/hero_banner', banner.gambar);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return prisma.heroBanner.delete({ where: { id } });
}

module.exports = { list, listActive, create, update, remove };
