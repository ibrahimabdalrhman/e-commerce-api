const { body, param, validationResult, query } = require("express-validator");
const prisma = require("@prisma/client").PrismaClient;
const prismaClient = new prisma();
const { validate } = require("../middlewares/validationMiddleware");

exports.validateCreateProduct = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name is required"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .notEmpty()
    .withMessage("Price is required"),

  body("categoryId")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a valid integer greater than 0")
    .notEmpty()
    .withMessage("Category ID is required")
    .custom(async (categoryId) => {
      // Check if the categoryId exists in the database
      const category = await prismaClient.category.findUnique({
        where: { id: +categoryId },
      });
      if (!category) {
        throw new Error("Category ID does not exist");
      }
      return true;
    }),

  validate,
];

exports.validateUpdateProduct = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid integer greater than 0"),

  body("name").optional().isString().withMessage("Name must be a string"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a valid integer greater than 0")
    .custom(async (categoryId) => {
      // Check if the categoryId exists in the database
      const category = await prismaClient.category.findUnique({
        where: { id: +categoryId },
      });
      if (!category) {
        throw new Error("Category ID does not exist");
      }
      return true;
    }),

  // Generalized error handler
  validate,
];

exports.validateGetAllProducts = [
  query("page")
    .optional() // Allow omission of the `page` query parameter
    .isInt({ min: 1 })
    .withMessage("Page must be a valid integer greater than 0"),

  query("limit")
    .optional() // Allow omission of the `limit` query parameter
    .isInt({ min: 1 })
    .withMessage("Limit must be a valid integer greater than 0"),

  // Generalized error handler
  validate,
];
