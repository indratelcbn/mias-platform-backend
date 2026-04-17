const dashboardService = require('../services/dashboard.service');

const getSummary = async (req, res, next) => {
  try {
    const { bulan, tahun } = req.query;
    const data = await dashboardService.getSummary({ bulan, tahun });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary };
