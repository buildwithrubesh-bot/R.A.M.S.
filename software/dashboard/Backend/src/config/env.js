require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
  securityServiceUrl: process.env.SECURITY_SERVICE_URL || "http://localhost:8000",
  deviceUsername: process.env.DEVICE_USERNAME || "esp32-device",
  devicePassword: process.env.DEVICE_PASSWORD || "change-this-device-password"
};

module.exports = { env };
