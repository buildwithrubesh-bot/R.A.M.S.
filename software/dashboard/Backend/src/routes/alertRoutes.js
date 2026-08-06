const router = require("express").Router();
const { getAlerts } = require("../controllers/alertController");
const { authenticateJwt } = require("../middleware/auth");
const { paginationValidator } = require("../validators/temperatureValidators");
const { validate } = require("../middleware/validate");

router.get("/", authenticateJwt, paginationValidator, validate, getAlerts);

module.exports = router;
