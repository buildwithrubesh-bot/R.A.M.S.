const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");

async function login(username, password) {
  const passwordHash = await bcrypt.hash(env.devicePassword, 10);
  const validUsername = username === env.deviceUsername;
  const validPassword = await bcrypt.compare(password, passwordHash);

  if (!validUsername || !validPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  return jwt.sign({ sub: username, role: "device" }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

module.exports = { login };
