const alertService = require("../services/alertService");

async function getAlerts(req, res, next) {
  try {
    const alerts = await alertService.getAlerts(req.query.limit || 100, req.query.offset || 0);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAlerts };
