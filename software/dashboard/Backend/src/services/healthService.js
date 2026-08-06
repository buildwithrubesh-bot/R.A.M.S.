const { pool } = require("../db/pool");
const { env } = require("../config/env");
const axios = require("axios");

async function getHealth() {
  const started = Date.now();
  let database = "unavailable";
  try {
    await pool.query("SELECT 1");
    database = "healthy";
  } catch (_error) {
    database = "unavailable";
  }

  let security = "unavailable";
  try {
    await axios.get(`${env.securityServiceUrl}/health`, { timeout: 1500 });
    security = "healthy";
  } catch (_error) {
    security = "unavailable";
  }

  return {
    status: database === "healthy" && security === "healthy" ? "healthy" : "degraded",
    uptime_seconds: Math.round(process.uptime()),
    database,
    security_service: security,
    latency_ms: Date.now() - started,
    timestamp: new Date().toISOString()
  };
}

module.exports = { getHealth };
