const { pool } = require("../db/pool");
const { logger } = require("../utils/logger");

async function createAlert(client, payload) {
  const result = await client.query(
    `INSERT INTO alerts (coach_no, axle_no, temperature, alert_level)
     VALUES ($1, $2, $3, $4)
     RETURNING id, coach_no, axle_no, temperature, alert_level, created_at`,
    [payload.coach_no, payload.axle_no, payload.temperature, payload.alert_level]
  );
  logger.warn("Abnormal temperature alert generated", payload);
  return result.rows[0];
}

async function getAlerts(limit = 100, offset = 0) {
  const result = await pool.query(
    `SELECT id, coach_no, axle_no, temperature, alert_level, created_at
     FROM alerts
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

module.exports = { createAlert, getAlerts };
