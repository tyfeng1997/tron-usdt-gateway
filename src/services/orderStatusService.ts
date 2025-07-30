import { redis } from "../redis/redisClient";
import { sendWebhook } from "../webhook/webhookService";

const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:4000/webhook";

export async function markOrderStatus(
  orderId: string,
  newStatus: "paid" | "expired"
) {
  const exists = await redis.exists(`order:${orderId}`);
  if (!exists) return false;

  await redis.hset(`order:${orderId}`, "status", newStatus);
  await redis.zrem("pending_orders", orderId);

  const order = await redis.hgetall(`order:${orderId}`);
  if (webhookUrl) {
    console.log(
      "",
      `Sending webhook for order ${orderId} status change to ${newStatus}`
    );
    await sendWebhook(webhookUrl, {
      orderId,
      status: newStatus,
      amount: order.amount,
      timestamp: Date.now(),
    });
  }

  return true;
}
