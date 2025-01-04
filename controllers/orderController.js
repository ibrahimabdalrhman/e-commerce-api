const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/ApiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");

exports.creatCasheOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new ApiError("User ID is required", 404));
  }

  const cart = await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart || !cart.cartItems.length) {
    return next(new ApiError("Cart is empty", 400));
  }

  const totalAmount = cart.cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const order = await prisma.order.create({
    data: {
      userId: parseInt(userId),
      totalAmount,
      paymentMethod: "CASH",
      orderItems: {
        create: cart.cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
    },
    include: { orderItems: true },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return res.status(201).json(order);
});

exports.getOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new ApiError("User ID is required", 404));
  }

  const orders = await prisma.order.findMany({
    where: { userId: parseInt(userId) },
    include: { orderItems: true },
  });

  return res.status(200).json(orders);
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;

  if (!orderId) {
    return next(new ApiError("Order ID is required", 404));
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { orderItems: true },
  });

  if (!order) {
    return next(new ApiError("Order not found", 404));
  }

  return res.status(200).json(order);
});

exports.acceptOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const orderStatus = "ACCEPTED";

  if (!orderId) {
    return next(new ApiError("Order ID is required", 404));
  }

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { orderStatus, isPaid: true, paidAt: new Date() },
    include: { orderItems: true },
  });

  return res.status(200).json(order);
});

exports.completedOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const orderStatus = "COMPLETED";

  if (!orderId) {
    return next(new ApiError("Order ID is required", 404));
  }

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { orderStatus },
    include: { orderItems: true },
  });

  return res.status(200).json(order);
});

exports.canceledOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const orderStatus = "CANCELED";

  if (!orderId) {
    return next(new ApiError("Order ID is required", 404));
  }

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { orderStatus },
    include: { orderItems: true },
  });

  return res.status(200).json(order);
});
