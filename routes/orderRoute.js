// Create order from cart
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middlewares/authMiddleware");
const {
  getOrders,
  getOrder,
  acceptOrder,
  canceledOrder,
  completedOrder,
  creatCasheOrder,
} = require("../controllers/orderController");
const allowToRole = require("../middlewares/roleMiddleware");

router.use(auth);

router.post("/cash/create", creatCasheOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.patch("/accepted-order/:id",  acceptOrder);
router.patch("/canceled-order/:id", canceledOrder);
router.patch("/completed-order/:id", allowToRole("ADMIN"), completedOrder);

module.exports = router;
