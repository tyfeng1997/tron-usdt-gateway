import express from "express";
import { createOrder } from "../services/orderService";
import { markOrderStatus } from "../services/orderStatusService";
import { redis } from "../redis/redisClient";
const router = express.Router();

/**
 * POST /api/order/create
 * body: { amount: number, orderId?: string }
 */
router.post("/create", async (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const order = await createOrder(parseFloat(amount), orderId);
    return res.json(order);
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
//TODO: just debug
router.post("/mark-paid", async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  const result = await markOrderStatus(orderId, "paid");
  if (!result) return res.status(404).json({ error: "Order not found" });

  return res.json({ success: true, orderId });
});

router.get("/:id/status", async (req, res) => {
  const orderId = req.params.id;

  const order = await redis.hgetall(`order:${orderId}`);
  if (!order || !order.status) {
    return res.status(404).json({ error: "Order not found" });
  }

  const { status, amount, address, createdAt } = order;
  return res.json({
    orderId,
    status,
    amount,
    address,
    createdAt: Number(createdAt),
  });
});

export default router;
