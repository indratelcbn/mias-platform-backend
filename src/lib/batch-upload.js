const path = require('path');

const getUploadedFiles = (req) => {
  if (Array.isArray(req.files) && req.files.length) return req.files;
  if (req.file) return [req.file];
  return [];
};

const buildBatchTitle = (baseTitle, file, index, total) => {
  if (total <= 1) return (baseTitle || '').trim();
  if (baseTitle && baseTitle.trim()) return `${baseTitle.trim()} ${index + 1}`;
  return path.parse(file.originalname).name.replace(/[-_]+/g, ' ').trim() || `Upload ${index + 1}`;
};

module.exports = { getUploadedFiles, buildBatchTitle };