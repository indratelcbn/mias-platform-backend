const authService = require('../services/auth.service');
const { verifyRecaptcha } = require('../lib/recaptcha');
const { isLocked, recordFailure, resetAttempts } = require('../lib/login-limiter');

const RECAPTCHA_MIN_SCORE = 0.5;

const login = async (req, res, next) => {
  try {
    const { username, password, recaptchaToken } = req.body;

    // 1. Cek apakah username sedang di-lock
    const lockStatus = isLocked(username);
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil(lockStatus.remainingMs / 60000);
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${minutesLeft} menit.`,
        retryAfterMs: lockStatus.remainingMs,
      });
    }

    // 2. Verifikasi reCAPTCHA v3
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success || recaptchaResult.score < RECAPTCHA_MIN_SCORE) {
      return res.status(400).json({
        success: false,
        message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.',
      });
    }

    // 3. Coba login
    try {
      const result = await authService.login(username, password);
      resetAttempts(username);
      res.json({ success: true, message: 'Login berhasil', data: result });
    } catch (loginErr) {
      if (loginErr.statusCode === 401) {
        const failResult = recordFailure(username);
        if (failResult.locked) {
          return res.status(429).json({
            success: false,
            message: 'Terlalu banyak percobaan login gagal. Akun dikunci selama 5 menit.',
            retryAfterMs: failResult.remainingMs,
          });
        }
        return res.status(401).json({
          success: false,
          message: `Username atau password salah. Sisa percobaan: ${failResult.attemptsLeft}`,
          attemptsLeft: failResult.attemptsLeft,
        });
      }
      throw loginErr;
    }
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getProfile, changePassword };
