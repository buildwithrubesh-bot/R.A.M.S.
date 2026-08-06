const router = require("express").Router();
const { login } = require("../controllers/authController");
const { loginValidator } = require("../validators/authValidators");
const { validate } = require("../middleware/validate");

router.post("/login", loginValidator, validate, login);

module.exports = router;
