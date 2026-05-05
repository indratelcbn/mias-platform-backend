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
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau kadaluarsa.',
    });
  }
};

const VALID_ROLES = ['ADMIN', 'SUPERADMIN', 'SOSIAL', 'DAKWAH', 'PENDIDIKAN', 'USAHA', 'KEUANGAN'];

const adminOnly = (req, res, next) => {
  if (!req.user || !VALID_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan.',
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

module.exports = { authMiddleware, adminOnly, superadminOnly };
