const temperatureService = require("../services/temperatureService");

async function createReading(req, res, next) {
  try {
    const result = await temperatureService.createTemperatureReading(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getLatest(req, res, next) {
  try {
    const readings = await temperatureService.getLatestReadings(req.query.limit || 20);
    res.json({ readings });
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const readings = await temperatureService.getAllReadings(req.query.limit || 100, req.query.offset || 0);
    res.json({ readings });
  } catch (error) {
    next(error);
  }
}

module.exports = { createReading, getLatest, getAll };
