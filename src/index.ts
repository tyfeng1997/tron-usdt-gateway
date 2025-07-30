import express from "express";
import bodyParser from "body-parser";
import orderRoutes from "./api/order";
import { cleanExpiredOrders } from "./services/cleanExpiredOrders";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/api/order", orderRoutes);

// 每分钟自动清理已过期订单
setInterval(() => {
  cleanExpiredOrders().catch(console.error);
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
