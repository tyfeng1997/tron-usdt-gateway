import { fetchUSDTTransfers } from "./tronClient";
import { redis } from "../redis/redisClient";
import { markOrderStatus } from "../services/orderStatusService";

const MY_WALLET_ADDRESS = process.env.MY_WALLET_ADDRESS;
let lastScanTimestamp = Date.now() - 60_000;

function parseAmount(raw: string): string {
  return (parseFloat(raw) / 1_000_000).toFixed(6); // USDT 精度是 6
}

export async function scanUSDTTransfers() {
  const events = await fetchUSDTTransfers(lastScanTimestamp);
  lastScanTimestamp = Date.now();

  if (!events.length) return;

  const pendingIds = await redis.zrange("pending_orders", 0, -1);
  const orders = new Map<string, string>(); // amount -> orderId

  for (const id of pendingIds) {
    const data = await redis.hgetall(`order:${id}`);
    if (data.status === "pending") {
      orders.set(data.amount, id);
    }
  }
  console.log(`[SCAN] Found ${events.length} new USDT transfers`);

  for (const event of events) {
    const recipient = `T${event.result.to}`; // addressBase58
    if (recipient !== MY_WALLET_ADDRESS) continue;

    const amount = parseAmount(event.result.value);
    const orderId = orders.get(amount);

    if (orderId) {
      console.log(`[MATCHED] ${amount} received for order ${orderId}`);
      await markOrderStatus(orderId, "paid");
      orders.delete(amount); // 避免重复处理
    }
  }
}
