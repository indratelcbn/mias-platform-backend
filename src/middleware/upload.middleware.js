const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sharp = require('sharp');

// ─── MIME / extension filter ──────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|webp)$/i;
  const allowedMime = /^image\/(jpeg|png|webp)$/;
  if (allowedExt.test(file.originalname) && allowedMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan.'));
  }
};

// ─── Factory: returns an object with .single(field) ───────────────────────────
// All files are:
//   1. Received in memory by multer
//   2. Processed by Sharp (resize + WebP compress)
//   3. Written to disk
//   4. req.file.filename patched so every existing controller works unchanged
//
// Options:
//   width       – max width  (keeps aspect ratio, never enlarges)
//   height      – max height (keeps aspect ratio, never enlarges)
//   quality     – WebP quality 1-100 (default 80)
//   maxSizeMB   – multer input limit in MB (default 10)
const createUpload = (subfolder, { width, height, quality = 80, maxSizeMB = 10 } = {}) => {
  const multerMemory = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });

  const processOneFile = async (file) => {
    const dir = path.join(__dirname, '../../uploads', subfolder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join(dir, filename);

    let img = sharp(file.buffer);
    if (width || height) {
      img = img.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }
    await img.webp({ quality }).toFile(outputPath);

    file.filename = filename;
    file.path = outputPath;
    file.destination = dir;
    delete file.buffer;
    return file;
  };

  const processWithSharp = async (req, res, next) => {
    if (!req.file && !(Array.isArray(req.files) && req.files.length)) return next();
    try {
      if (Array.isArray(req.files) && req.files.length) {
        req.files = await Promise.all(req.files.map((file) => processOneFile(file)));
      } else if (req.file) {
        req.file = await processOneFile(req.file);
      }
      next();
    } catch (err) {
      next(err);
    }
  };

  return {
    single: (fieldname) => (req, res, next) => {
      multerMemory.single(fieldname)(req, res, (err) => {
        if (err) return next(err);
        processWithSharp(req, res, next);
      });
    },
    array: (fieldname, maxCount = 20) => (req, res, next) => {
      multerMemory.array(fieldname, maxCount)(req, res, (err) => {
        if (err) return next(err);
        processWithSharp(req, res, next);
      });
    },
  };
};

// ─── Upload instances ─────────────────────────────────────────────────────────
// Thumbnails (kajian, artikel): max 900px wide, 80 quality
const uploadThumbnail = createUpload('thumbnails', { width: 900, quality: 80 });

// Bukti transfer infaq: max 1200px – needs to remain legible
const uploadBuktiTransfer = createUpload('bukti_transfer', { width: 1200, quality: 82 });

// QRIS: 600×600 box, higher quality so QR pattern stays scannable
const uploadQris = createUpload('qris', { width: 600, height: 600, quality: 88 });

// Galeri foto (Ramadhan / Sholat Ied): max 1200px wide
const uploadGaleri = createUpload('galeri', { width: 1200, quality: 80 });

// Dokumentasi Qurban: max 1200px wide
const uploadQurban = createUpload('qurban', { width: 1200, quality: 80 });

// Program Sosial foto: max 1200px wide  ← separate subfolder from galeri
const uploadSosial = createUpload('sosial', { width: 1200, quality: 80 });

// Pendidikan foto: max 1200px wide
const uploadPendidikan = createUpload('pendidikan', { width: 1200, quality: 80 });

// Umroh flyer: max 1200px wide, higher quality for promotional material
const uploadUmroh = createUpload('umroh', { width: 1200, quality: 85 });

// Mias Mart produk foto: max 900px, square-ish product images
const uploadMart = createUpload('mart', { width: 900, quality: 82 });

// Profil foto: sejarah hero, struktur, pemateri
const uploadProfilFoto   = createUpload('profil', { width: 1200, quality: 82 });

// Fasilitas dokumentasi foto
const uploadFasilitas = createUpload('profil_fasilitas', { width: 1200, quality: 80 });

// Hero Banner: max 1920px wide, high quality for full-width banners
const uploadHeroBanner = createUpload('hero_banner', { width: 1920, quality: 85 });

// Popup flyer: promo/event material for the first website visit
const uploadPopup = createUpload('popup', { width: 1200, quality: 85 });

module.exports = { uploadThumbnail, uploadBuktiTransfer, uploadQris, uploadGaleri, uploadQurban, uploadSosial, uploadPendidikan, uploadUmroh, uploadMart, uploadProfilFoto, uploadFasilitas, uploadHeroBanner, uploadPopup };

