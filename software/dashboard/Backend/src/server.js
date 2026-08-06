const app = require("./app");
const { env } = require("./config/env");
const { logger } = require("./utils/logger");

const server = app.listen(env.port, () => {
  logger.info(`RAMS API listening on port ${env.port}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
