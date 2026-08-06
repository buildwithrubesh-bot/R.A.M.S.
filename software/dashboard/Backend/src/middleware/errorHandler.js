const { logger } = require("../utils/logger");

function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  logger[isServerError ? "error" : "warn"](error.message, {
    path: req.originalUrl,
    method: req.method,
    details: error.details,
    stack: isServerError ? error.stack : undefined
  });

  res.status(statusCode).json({
    message: isServerError ? "Internal server error" : error.message,
    details: isServerError ? undefined : error.details
  });
}

module.exports = { errorHandler };
