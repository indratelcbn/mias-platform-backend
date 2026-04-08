const { getSetting, updateSetting } = require('../services/setting.service');

async function getPublic(req, res, next) {
  try {
    const setting = await getSetting();
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { facebook, instagram, youtube, whatsapp, alamat, telepon, email, jamOperasional } = req.body;
    const data = {};
    if (facebook       !== undefined) data.facebook       = facebook       || null;
    if (instagram      !== undefined) data.instagram      = instagram      || null;
    if (youtube        !== undefined) data.youtube        = youtube        || null;
    if (whatsapp       !== undefined) data.whatsapp       = whatsapp       || null;
    if (alamat         !== undefined) data.alamat         = alamat         || null;
    if (telepon        !== undefined) data.telepon        = telepon        || null;
    if (email          !== undefined) data.email          = email          || null;
    if (jamOperasional !== undefined) data.jamOperasional = jamOperasional || null;

    const setting = await updateSetting(data);
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublic, update };
