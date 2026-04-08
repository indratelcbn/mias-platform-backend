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

  const processWithSharp = async (req, res, next) => {
    if (!req.file) return next();
    try {
      const dir = path.join(__dirname, '../../uploads', subfolder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `${uuidv4()}.webp`;
      const outputPath = path.join(dir, filename);

      let img = sharp(req.file.buffer);
      if (width || height) {
        img = img.resize(width, height, { fit: 'inside', withoutEnlargement: true });
      }
      await img.webp({ quality }).toFile(outputPath);

      // Patch req.file so controllers keep working without any changes
      req.file.filename = filename;
      req.file.path = outputPath;
      req.file.destination = dir;
      delete req.file.buffer; // free memory

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
  };
};

// ─── Upload instances ─────────────────────────────────────────────────────────
// Thumbnails (kajian, artikel): max 900px wide, 80 quality
const uploadThumbnail = createUpload('thumbnails', { width: 900, quality: 80 });

// Bukti transfer donasi: max 1200px – needs to remain legible
const uploadBuktiTransfer = createUpload('bukti_transfer', { width: 1200, quality: 82 });

// QRIS: 600×600 box, higher quality so QR pattern stays scannable
const uploadQris = createUpload('qris', { width: 600, height: 600, quality: 88 });

// Galeri foto (Ramadhan / Sholat Ied): max 1200px wide
const uploadGaleri = createUpload('galeri', { width: 1200, quality: 80 });

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

module.exports = { uploadThumbnail, uploadBuktiTransfer, uploadQris, uploadGaleri, uploadSosial, uploadPendidikan, uploadUmroh, uploadMart, uploadProfilFoto, uploadFasilitas };

