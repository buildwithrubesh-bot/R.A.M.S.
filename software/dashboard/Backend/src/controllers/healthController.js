const healthService = require("../services/healthService");

async function health(req, res, next) {
  try {
    res.json(await healthService.getHealth());
  } catch (error) {
    next(error);
  }
}

module.exports = { health };
