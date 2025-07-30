import { redis } from "../redis/redisClient";

const ORDER_TTL_MS = 15 * 60 * 1000;

export async function cleanExpiredOrders() {
  const now = Date.now();
  const expiredBefore = now - ORDER_TTL_MS;

  const expiredOrderIds = await redis.zrangebyscore(
    "pending_orders",
    0,
    expiredBefore
  );

  for (const orderId of expiredOrderIds) {
    const exists = await redis.exists(`order:${orderId}`);
    if (!exists) {
      await redis.zrem("pending_orders", orderId); // 已过期自动清除
    } else {
      const currentStatus = await redis.hget(`order:${orderId}`, "status");
      if (currentStatus === "pending") {
        await redis.hset(`order:${orderId}`, "status", "expired");
      }
      await redis.zrem("pending_orders", orderId);
    }
  }

  if (expiredOrderIds.length > 0) {
    console.log(
      `[Cleaner] Removed expired orders: ${expiredOrderIds.join(", ")}`
    );
  }
}
