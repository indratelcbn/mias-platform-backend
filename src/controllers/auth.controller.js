const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
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
