import axios from "axios";

const USDT_CONTRACT = process.env.TRON_USDT_ADDRESS;
const BASE_URL = process.env.TRONGRID_BASE_URL;
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY;
console.log(BASE_URL, TRONGRID_API_KEY, USDT_CONTRACT);
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "TRON-PRO-API-KEY": TRONGRID_API_KEY || "",
  },
});

export async function fetchUSDTTransfers(sinceTimestamp: number) {
  const res = await axiosInstance.get(`/v1/contracts/${USDT_CONTRACT}/events`, {
    params: {
      event_name: "Transfer",
      only_confirmed: true,
      limit: 100,
      min_timestamp: sinceTimestamp,
      sort: "block_timestamp,asc",
    },
  });
  console.log(
    `[TRON] Fetched ${res.data.data.length} USDT transfers since ${new Date(
      sinceTimestamp
    ).toISOString()}`
  );

  return res.data.data;
}
