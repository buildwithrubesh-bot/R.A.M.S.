const { body } = require("express-validator");

const loginValidator = [
  body("username").trim().isLength({ min: 3, max: 64 }).escape(),
  body("password").isLength({ min: 8, max: 128 })
];

module.exports = { loginValidator };
