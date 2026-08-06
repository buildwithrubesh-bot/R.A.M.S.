const router = require("express").Router();
const controller = require("../controllers/temperatureController");
const { authenticateJwt } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  readingValidator,
  paginationValidator,
  latestValidator
} = require("../validators/temperatureValidators");

router.use(authenticateJwt);
router.post("/", readingValidator, validate, controller.createReading);
router.get("/latest", latestValidator, validate, controller.getLatest);
router.get("/", paginationValidator, validate, controller.getAll);

module.exports = router;
