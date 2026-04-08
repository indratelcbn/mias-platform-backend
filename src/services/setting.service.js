const prisma = require('../lib/prisma');

async function getSetting() {
  let setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!setting) {
    setting = await prisma.siteSetting.create({
      data: { id: 1 },
    });
  }
  return setting;
}

async function updateSetting(data) {
  return prisma.siteSetting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}

module.exports = { getSetting, updateSetting };
