import axios from "axios";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default_secret";

export async function sendWebhook(url: string, payload: Record<string, any>) {
  const sign = createSignature(payload);
  const body = {
    ...payload,
    sign,
  };

  try {
    const res = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`[Webhook] Sent to ${url}, status: ${res.status}`);
    return true;
  } catch (err: any) {
    console.error(`[Webhook] Failed to send to ${url}`, err.message);
    return false;
  }
}

function createSignature(payload: Record<string, any>): string {
  const sorted = Object.entries(payload)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(sorted)
    .digest("hex");
}
