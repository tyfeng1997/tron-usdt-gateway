import { redis } from "../redis/redisClient";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { sendWebhook } from "../webhook/webhookService";
const MY_WALLET_ADDRESS = process.env.MY_WALLET_ADDRESS;
const ORDER_TTL = 15 * 60; // 15分钟
const AMOUNT_PRECISION = 6;
const webhookUrl = process.env.WEBHOOK_URL;

function padAmount(base: number, index: number): string {
  return (base + index * 0.000001).toFixed(AMOUNT_PRECISION);
}

export async function createOrder(baseAmount: number, customOrderId?: string) {
  const now = Date.now();
  const orderId = customOrderId || uuidv4();

  const pendingOrders = await redis.zrange("pending_orders", 0, -1);
  const usedAmounts = new Set<string>();

  for (const id of pendingOrders) {
    const order = await redis.hgetall(`order:${id}`);
    if (order && order.status === "pending") {
      usedAmounts.add(order.amount);
    }
  }

  let index = 0;
  let uniqueAmount = padAmount(baseAmount, index);
  while (usedAmounts.has(uniqueAmount)) {
    index++;
    uniqueAmount = padAmount(baseAmount, index);
    if (index > 999999) throw new Error("Too many similar pending orders");
  }

  const order = {
    orderId,
    amount: uniqueAmount,
    address: MY_WALLET_ADDRESS,
    status: "pending",
    createdAt: now,
  };

  await redis.hmset(`order:${orderId}`, order);
  await redis.expire(`order:${orderId}`, ORDER_TTL);
  await redis.zadd("pending_orders", now, orderId);

  const qrCodeUrl = await QRCode.toDataURL(`${MY_WALLET_ADDRESS}`);
  console.log(
    webhookUrl,
    `[Order] Created order ${orderId} with amount ${uniqueAmount}`
  );
  if (webhookUrl) {
    console.log(
      `[Webhook] Sending order creation for ${orderId} with amount ${uniqueAmount}`
    );
    await sendWebhook(webhookUrl, {
      orderId,
      status: "pending",
      amount: uniqueAmount,
      timestamp: now,
    });
  }
  return {
    ...order,
    qrCodeUrl,
  };
}
