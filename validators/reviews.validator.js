const { body, param } = require("express-validator");
const { validate } = require("../middlewares/validationMiddleware");

exports.validateAddReview = [
  param("prodoctId")
    .exists()
    .withMessage("Product ID is required")
    .isInt()
    .withMessage("Product ID must be an integer"),
  body("rating")
    .exists()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .exists()
    .withMessage("Comment is required")
    .isString()
    .withMessage("Comment must be a string"),
  validate, // Middleware to handle validation errors
];

exports.validateUpdateReview = [
  param("id")
    .exists()
    .withMessage("Review ID is required")
    .isInt()
    .withMessage("Review ID must be an integer"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment").optional().isString().withMessage("Comment must be a string"),
  validate, // Middleware to handle validation errors
];
