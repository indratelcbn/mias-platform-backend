const authService = require('../services/auth.service');
const { verifyRecaptcha } = require('../lib/recaptcha');

const RECAPTCHA_MIN_SCORE = 0.5;

const login = async (req, res, next) => {
  try {
    const { username, password, recaptchaToken } = req.body;

    // Verifikasi reCAPTCHA v3
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success || recaptchaResult.score < RECAPTCHA_MIN_SCORE) {
      return res.status(400).json({
        success: false,
        message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.',
      });
    }

    const result = await authService.login(username, password);
    res.json({ success: true, message: 'Login berhasil', data: result });
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
