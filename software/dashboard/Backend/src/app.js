const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const { logger, httpLogStream } = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const authRoutes = require("./routes/authRoutes");
const temperatureRoutes = require("./routes/temperatureRoutes");
const alertRoutes = require("./routes/alertRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("combined", { stream: httpLogStream }));

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn("Rate limit exceeded", { ip: req.ip, path: req.originalUrl });
      res.status(429).json({ message: "Too many requests" });
    }
  })
);

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/temperature", temperatureRoutes);
app.use("/api/alerts", alertRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
