import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import orderRoutes from "./api/order";
import { cleanExpiredOrders } from "./services/cleanExpiredOrders";
import { scanUSDTTransfers } from "./tron/tronScanner";
import { redis } from "./redis/redisClient";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/api/order", orderRoutes);

// 每分钟自动清理已过期订单
setInterval(() => {
  cleanExpiredOrders().catch(console.error);
}, 60 * 1000);

setInterval(async () => {
  const count = await redis.zcard("pending_orders");
  if (count > 0) {
    await scanUSDTTransfers();
  }
}, 15 * 1000); // 每15秒轮询一次

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
