const { body, query } = require("express-validator");

const readingValidator = [
  body("coach_no").trim().matches(/^[A-Za-z0-9_-]{1,32}$/).escape(),
  body("axle_no").trim().matches(/^[A-Za-z0-9_-]{1,32}$/).escape(),
  body("temperature").isFloat({ min: -40, max: 200 }).toFloat(),
  body("recorded_at").optional().isISO8601().toDate()
];

const paginationValidator = [
  query("limit").optional().isInt({ min: 1, max: 500 }).toInt(),
  query("offset").optional().isInt({ min: 0, max: 1000000 }).toInt()
];

const latestValidator = [
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = { readingValidator, paginationValidator, latestValidator };
