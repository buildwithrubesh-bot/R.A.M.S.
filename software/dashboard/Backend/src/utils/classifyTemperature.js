const { TemperatureStatus } = require("../config/constants");

function classifyTemperature(temperature) {
  if (temperature < 60) return TemperatureStatus.NORMAL;
  if (temperature <= 80) return TemperatureStatus.WARNING;
  return TemperatureStatus.CRITICAL;
}

module.exports = { classifyTemperature };
