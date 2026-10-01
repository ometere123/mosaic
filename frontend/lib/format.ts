export const WEI = 10n ** 18n;

export function genToWei(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{0,18})?$/.test(trimmed)) throw new Error("Enter a valid GEN amount with up to 18 decimals.");
  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole) * WEI + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

export function weiToGen(value: string | bigint, decimals = 2): string {
  const n = typeof value === "bigint" ? value : BigInt(value || "0");
  const whole = n / WEI;
  const fraction = (n % WEI).toString().padStart(18, "0").slice(0, Math.max(0, decimals));
  return decimals === 0 ? whole.toString() : `${whole}.${fraction}`;
}

export function shortHex(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head + 2)}…${value.slice(-tail)}`;
}

export function dateTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts * 1000));
}

export function timeLeft(closeAt: number, now = Math.floor(Date.now() / 1000)): string {
  const delta = closeAt - now;
  if (delta <= 0) return "closed";
  const days = Math.floor(delta / 86400);
  if (days > 0) return `${days}d left`;
  const hours = Math.ceil(delta / 3600);
  return `${hours}h left`;
}
