const { pool } = require("../db/pool");
const { classifyTemperature } = require("../utils/classifyTemperature");
const { assessTemperatureReading } = require("./securityService");
const { createAlert } = require("./alertService");
const { AppError } = require("../utils/AppError");
const { logger } = require("../utils/logger");

async function getRecentForSensor(coachNo, axleNo, limit = 5) {
  const result = await pool.query(
    `SELECT temperature, status, recorded_at
     FROM temperature_readings
     WHERE coach_no = $1 AND axle_no = $2
     ORDER BY recorded_at DESC
     LIMIT $3`,
    [coachNo, axleNo, limit]
  );
  return result.rows;
}

async function createTemperatureReading(payload) {
  const coachNo = payload.coach_no;
  const axleNo = payload.axle_no;
  const temperature = Number(payload.temperature);
  const recordedAt = payload.recorded_at || new Date();
  const recentReadings = await getRecentForSensor(coachNo, axleNo);
  const risk = await assessTemperatureReading(
    { coach_no: coachNo, axle_no: axleNo, temperature, recorded_at: recordedAt },
    recentReadings
  );

  if (!risk.accepted) {
    logger.warn("Rejected suspicious sensor reading", { coachNo, axleNo, temperature, risk });
    throw new AppError("Reading rejected by security service", 422, risk);
  }

  const status = classifyTemperature(temperature);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO temperature_readings (coach_no, axle_no, temperature, status, recorded_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, coach_no, axle_no, temperature, status, recorded_at`,
      [coachNo, axleNo, temperature, status, recordedAt]
    );

    let alert = null;
    if (status !== "NORMAL") {
      alert = await createAlert(client, {
        coach_no: coachNo,
        axle_no: axleNo,
        temperature,
        alert_level: status
      });
    }

    await client.query("COMMIT");
    logger.info("Temperature reading stored", { coachNo, axleNo, temperature, status });
    return { reading: inserted.rows[0], alert, risk };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getLatestReadings(limit = 20) {
  const result = await pool.query(
    `SELECT DISTINCT ON (coach_no, axle_no)
      id, coach_no, axle_no, temperature, status, recorded_at
     FROM temperature_readings
     ORDER BY coach_no, axle_no, recorded_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function getAllReadings(limit = 100, offset = 0) {
  const result = await pool.query(
    `SELECT id, coach_no, axle_no, temperature, status, recorded_at
     FROM temperature_readings
     ORDER BY recorded_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

module.exports = {
  createTemperatureReading,
  getLatestReadings,
  getAllReadings,
  getRecentForSensor
};
