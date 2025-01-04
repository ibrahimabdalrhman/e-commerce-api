const { body, param, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validate } = require("../middlewares/validationMiddleware");

// Validate addToCart
exports.validateAddToCart = [
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid integer greater than 0")
    .custom(async (value) => {
      const product = await prisma.product.findUnique({ where: { id: value } });
      if (!product) {
        throw new Error("Product not found");
      }
    }),

  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a valid integer greater than 0")
    .notEmpty()
    .withMessage("Quantity is required"),

  validate,
];

// Validate updateCartItem
exports.validateUpdateCartItem = [
  param("cartItemId")
    .isInt({ min: 1 })
    .withMessage("Cart item ID must be a valid integer greater than 0")
    .custom(async (value) => {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: +value },
      });
      if (!cartItem) {
        throw new Error("Cart item not found");
      }
    }),

  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a valid integer greater than 0")
    .notEmpty()
    .withMessage("Quantity is required"),

  // Generalized error handler
  validate,
];
