const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/apiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const crypto = require("crypto");

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

exports.onlinPaymentOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.body.orderId;
  const userId = req.user.id;

  if (!orderId) {
    return next(new ApiError("Order ID is required", 404));
  }

  // Fetch the order details
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { orderItems: true },
  });

  if (!order) {
    return next(new ApiError("Order not found", 404));
  }

  if (order.userId !== userId) {
    return next(
      new ApiError("You are not authorized to pay for this order", 401)
    );
  }
  try {
    // Step 1: Generate Auth Token
    const authResponse = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/auth/tokens`,
      {
        api_key: process.env.PAYMOB_API_KEY,
      }
    );
    if (!authResponse.data.token) {
      return next(new ApiError("Payment initiation failed", 500));
    }
    const authToken = authResponse.data.token;

    // Step 2: Register an Order with Paymob
    const orderRegistration = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/ecommerce/orders`,
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: order.totalAmount * 100, // Paymob requires the amount in cents
        currency: "EGP",
        items: order.orderItems.map((item) => ({
          name: `Product ${item.productId}`,
          amount_cents: item.price * 100,
          quantity: item.quantity,
        })),
      }
    );

    const paymobOrderId = orderRegistration.data.id;

    // Step 3: Generate Payment Key
    const billingData = {
      userId: userId,
      first_name: "jac",
      last_name: "jac",
      email: "user@example.com",
      phone_number: "01000000000",
      street: "123 Street",
      building: "Building 1",
      floor: "2",
      apartment: "4B",
      city: "Cairo",
      country: "EG",
    };
    const data = {
      userId: userId,
    };
    const extra = {
      userId: userId,
    };

    const paymentKeyResponse = await axios.post(
      `${process.env.PAYMOB_BASE_URL}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: order.totalAmount * 100,
        expiration: 3600, // 1 hour
        order_id: paymobOrderId,
        billing_data: billingData,
        currency: "EGP",
        integration_id: process.env.PAYMOB_INTEGRATION_ID,
        data: data,
        extra: extra,
      }
    );
    const paymentKey = paymentKeyResponse.data.token;

    // Step 4: Generate Iframe URL
    const iframeUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    res.status(200).json({ iframeUrl });
  } catch (error) {
    console.log(error);
    next(new ApiError("Payment initiation failed", 500));
  }
});

exports.webhook = asyncHandler(async (req, res) => {
  const secret = process.env.PAYMOB_HMAC_SECRET; // Paymob HMAC Secret
  const incomingHMAC = req.query.hmac;
  const payload = JSON.stringify(req.body);

  console.log("secret", secret);
  console.log("Incoming HMAC", incomingHMAC);
  console.log("payload", payload);

  const calculatedHMAC = crypto
    .createHmac("sha512", secret)
    .update(Buffer.from(payload, 'utf8'))
    .digest("hex");
  
  console.log("calculatedHMAC", calculatedHMAC);

  if (calculatedHMAC !== incomingHMAC) {
    console.error("Invalid HMAC signature");
    return next(new ApiError("Invalid HMAC signature", 400));
  }

  const paymentStatus = req.body.obj.success; // Payment status (true or false)
  const paymentId = req.body.obj.id; // Payment transaction ID
  const userId = req.body.extra?.userId;
  if (paymentStatus) {
    // Process successful payment
    console.log("Payment successful", paymentId, userId);
    // Here you can update the order status or take further actions as needed.
  } else {
    // Handle failed payment
    console.log("Payment failed", paymentId, userId);
    // Update order or notify user as needed
  }

  res.status(200).json({ message: "Webhook received" });
});
