const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const token = await authService.login(req.body.username, req.body.password);
    res.json({ token, token_type: "Bearer" });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };
