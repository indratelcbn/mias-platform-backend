const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');

function removePopupFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '../../uploads/popup', filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

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
  const existing = await getSetting();
  if (
    Object.prototype.hasOwnProperty.call(data, 'popupImage') &&
    existing.popupImage &&
    existing.popupImage !== data.popupImage
  ) {
    removePopupFile(existing.popupImage);
  }

  return prisma.siteSetting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}

module.exports = { getSetting, updateSetting };
