const { body, param, validationResult } = require("express-validator");
const prisma = require("@prisma/client").PrismaClient;
const prismaClient = new prisma();
const { validate } = require("../middlewares/validationMiddleware");

exports.validateCreateCategory = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name is required"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  validate,
];

exports.validateUpdateCategory = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid integer greater than 0"),

  body("name").optional().isString().withMessage("Name must be a string"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  validate,
];
