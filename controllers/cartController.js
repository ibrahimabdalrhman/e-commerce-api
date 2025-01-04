const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/ApiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");

exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  if (!userId) {
    return next(new ApiError("User ID is required", 404));
  }

  let cart = await prisma.cart.findFirst({
    where: { userId: userId },
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: userId },
      include: { cartItems: { include: { product: true } } },
    });
  }

  const existingCartItem = cart.cartItems.find(
    (item) => item.productId === productId
  );

  if (existingCartItem) {
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: existingCartItem.quantity + quantity },
    });
    return res.status(200).json(updatedCartItem);
  } else {
    const newCartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
      },
    });
    return res.status(201).json(newCartItem);
  }
});

exports.viewCart = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new ApiError("User ID is required", 404));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  const cart = await prisma.cart.findFirst({
    where: { userId: userId },
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart) {
    return next(new ApiError("Cart not found", 404));
  }

  return res.status(200).json(cart);
});

exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { cartItemId } = req.params;
  const userId = req.user.id;
  const cart = await prisma.cart.findFirst({
    where: { userId: userId },
  });

  if (!cartItemId) {
    return next(new ApiError("Cart item ID is required", 400));
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: +cartItemId },
  });

  if (!cartItem) {
    return next(new ApiError("Cart item not found", 404));
  }
  if (cartItem.cartId !== cart.id) {
    return next(new ApiError("Cart item not found", 404));
  }

  await prisma.cartItem.delete({
    where: { id: +cartItemId },
  });

  return res.status(204).end();
});

exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;
  const cart = await prisma.cart.findFirst({
    where: { userId: userId },
  });

  if (!cart) {
    return next(new ApiError("Cart not found", 404));
  }
  console.log(cart);
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: +cartItemId },
  });
  if (!cartItem) {
    return next(new ApiError("Cart item not found", 404));
  }
  if (cartItem.cartId !== cart.id) {
    return next(new ApiError("Cart item not found", 404));
  }

  const updatedCartItem = await prisma.cartItem.update({
    where: { id: +cartItemId },
    data: { quantity: quantity },
  });

  return res.status(200).json(updatedCartItem);
});
