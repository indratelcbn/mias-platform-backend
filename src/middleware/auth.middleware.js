const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Block write operations immediately for VIEWER role
    if (
      decoded.role === 'VIEWER' &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Role Viewer hanya dapat melihat data, tidak dapat menambah, mengubah, atau menghapus.',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau kadaluarsa.',
    });
  }
};

const VALID_ROLES = ['ADMIN', 'SUPERADMIN', 'SOSIAL', 'DAKWAH', 'PENDIDIKAN', 'USAHA', 'KEUANGAN', 'VIEWER'];

const adminOnly = (req, res, next) => {
  if (!req.user || !VALID_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan.',
    });
  }
  next();
};

// Block write operations for VIEWER role (applied globally on /api)
const viewerBlock = (req, res, next) => {
  if (
    req.user?.role === 'VIEWER' &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Role VIEWER hanya dapat melihat data.',
    });
  }
  next();
};

const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya SUPERADMIN yang diizinkan.',
    });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, superadminOnly, viewerBlock };
