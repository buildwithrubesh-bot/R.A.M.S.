const fs = require("fs");
const path = require("path");
const winston = require("winston");

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: path.join(logDir, "app.log") }),
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" })
  ]
});

const httpLogStream = {
  write: (message) => logger.info(message.trim())
};

module.exports = { logger, httpLogStream };
