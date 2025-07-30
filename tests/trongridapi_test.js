import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { TronWeb } from "tronweb";

const MY_WALLET_ADDRESS = process.env.MY_WALLET_ADDRESS;
const USDT_CONTRACT = process.env.TRON_USDT_ADDRESS;
const BASE_URL = process.env.TRONGRID_BASE_URL;
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY;
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "TRON-PRO-API-KEY": TRONGRID_API_KEY || "",
  },
});
const tronweb = new TronWeb({
  fullHost: BASE_URL,
});
export async function fetchUSDTTransfers() {
  const res = await axiosInstance.get(`/v1/contracts/${USDT_CONTRACT}/events`, {
    params: {
      event_name: "Transfer",
      only_confirmed: true,
      min_block_timestamp: Date.now() - 60 * 1000 * 15,
      order_by: "block_timestamp,desc",
      limit: 200,
    },
  });

  return res.data.data;
}
const events = await fetchUSDTTransfers();
console.log(`Found ${events.length} USDT transfers`);
for (const event of events) {
  const recipient = `${event.result.to}`; // hex
  const recipientAddress = tronweb.address.fromHex(recipient);
  if (recipientAddress !== MY_WALLET_ADDRESS) continue;
  console.log(
    `[OOPS ]Transfer to ${recipientAddress}, amount: ${
      event.result.value / 1e6
    }`
  );
}
console.log(`First event: ${events[0].transaction_id}`);
console.log(events[0]);
console.log(`Last event: ${events[events.length - 1].transaction_id}`);
console.log(events[events.length - 1]);
