const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const {
  addToCart,
  viewCart,
  removeFromCart,
  updateCartItem,
} = require("../controllers/cartController");
const prisma = new PrismaClient();

// Add product to cart
const auth = require("../middlewares/authMiddleware");
const {
  validateAddToCart,
  validateUpdateCartItem,
} = require("../validators/cart.validaroe");

router.use(auth);

router.post("/add", validateAddToCart, addToCart);

router.get("/", viewCart);

router.patch("/update/:cartItemId", validateUpdateCartItem, updateCartItem);

router.delete("/delete/:cartItemId", removeFromCart);

module.exports = router;
