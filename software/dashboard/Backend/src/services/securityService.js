const axios = require("axios");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");
const { logger } = require("../utils/logger");

async function assessTemperatureReading(reading, recentReadings) {
  try {
    const response = await axios.post(
      `${env.securityServiceUrl}/assess`,
      {
        ...reading,
        recent_temperatures: recentReadings.map((item) => Number(item.temperature))
      },
      { timeout: 2500 }
    );

    return response.data;
  } catch (error) {
    logger.error("Security service unavailable", { error: error.message });
    throw new AppError("Security risk assessment unavailable", 503);
  }
}

module.exports = { assessTemperatureReading };
