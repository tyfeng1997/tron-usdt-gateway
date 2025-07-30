import { fetchUSDTTransfers } from "./tronClient";
import { redis } from "../redis/redisClient";
import { markOrderStatus } from "../services/orderStatusService";
import { TronWeb } from "tronweb";
const MY_WALLET_ADDRESS = process.env.MY_WALLET_ADDRESS;
const tronweb = new TronWeb({
  fullHost: process.env.TRONGRID_BASE_URL,
});

function parseAmount(raw: string): string {
  return (parseFloat(raw) / 1_000_000).toFixed(6);
}

export async function scanUSDTTransfers() {
  const events = await fetchUSDTTransfers();

  if (!events.length) return;

  const pendingIds = await redis.zrange("pending_orders", 0, -1);
  const orders = new Map<string, { id: string; createdAt: number }>(); // amount -> orderId
  let minOrderTimestamp = Number.MAX_SAFE_INTEGER;

  for (const id of pendingIds) {
    const data = await redis.hgetall(`order:${id}`);
    console.log(
      `[SCAN] Order ${id} status: ${data.status}, amount: ${data.amount} ,address: ${data.address}`
    );

    if (data.status === "pending") {
      const createdAt = parseInt(data.createdAt);
      orders.set(data.amount, { id, createdAt });
      if (createdAt < minOrderTimestamp) {
        minOrderTimestamp = createdAt;
      }
    }
  }
  if (orders.size === 0) return;

  for (const event of events) {
    const txTimestamp = event.block_timestamp;
    if (txTimestamp < minOrderTimestamp) continue;

    const hexAddress = event.result.to;
    const recipientAddress = tronweb.address.fromHex(hexAddress);
    if (recipientAddress !== MY_WALLET_ADDRESS) continue;

    const amount = parseAmount(event.result.value);
    const orderMatch = orders.get(amount);

    if (orderMatch && txTimestamp >= orderMatch.createdAt) {
      console.log(`[MATCHED] ${amount} received for order ${orderMatch.id}`);
      await markOrderStatus(orderMatch.id, "paid");
      orders.delete(amount); // 防止重复处理
    }
  }
}
