import axios from "axios";
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

export async function fetchUSDTTransfers() {
  const res = await axiosInstance.get(`/v1/contracts/${USDT_CONTRACT}/events`, {
    params: {
      event_name: "Transfer",
      only_confirmed: true,
      order_by: "block_timestamp,desc",
      limit: 200,
    },
  });

  return res.data.data;
}
