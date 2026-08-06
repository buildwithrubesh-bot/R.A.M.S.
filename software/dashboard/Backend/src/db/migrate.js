const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");
const { logger } = require("../utils/logger");

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);
  logger.info("Database migration completed");
  await pool.end();
}

migrate().catch((error) => {
  logger.error("Database migration failed", { error: error.message });
  process.exit(1);
});
