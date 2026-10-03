import { resetReadClient } from "./genlayer";

export const MAX_PUBLIC_READ_CONCURRENCY = 4;
const DEFAULT_DELAYS = [250, 600, 1200];
const inFlight = new Map<string, Promise<unknown>>();
let activeReads = 0;
const waiters: Array<() => void> = [];

async function withReadSlot<T>(operation: () => Promise<T>): Promise<T> {
  if (activeReads >= MAX_PUBLIC_READ_CONCURRENCY) await new Promise<void>((resolve) => waiters.push(resolve));
  activeReads += 1;
  try { return await operation(); }
  finally {
    activeReads -= 1;
    waiters.shift()?.();
  }
}

type RetryOptions = {
  attempts?: number;
  delaysMs?: number[];
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
  reset?: () => void;
};

export function isTransientReadError(error: unknown): boolean {
  const text = (error instanceof Error ? `${error.name} ${error.message}` : String(error)).toLowerCase();
  return [
    "failed to fetch", "fetch failed", "networkerror", "network error", "network request failed",
    "timeout", "timed out", "econnreset", "econnrefused", "enotfound", "socket hang up",
    "http 429", "status 429", "http 502", "status 502", "http 503", "status 503",
    "http 504", "status 504", "temporarily unavailable", "temporary rpc",
  ].some((marker) => text.includes(marker));
}

export async function readWithRetry<T>(key: string, operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const attempts = options.attempts ?? 4;
  const delays = options.delaysMs ?? DEFAULT_DELAYS;
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const reset = options.reset ?? resetReadClient;
  const task = (async () => {
    for (let attempt = 0; ; attempt++) {
      try { return await withReadSlot(operation); }
      catch (error) {
        if (!isTransientReadError(error) || attempt >= attempts - 1) throw error;
        reset();
        const base = delays[Math.min(attempt, delays.length - 1)] ?? 1200;
        await sleep(Math.round(base * (0.9 + random() * 0.2)));
      }
    }
  })();
  inFlight.set(key, task);
  try { return await task; }
  finally { if (inFlight.get(key) === task) inFlight.delete(key); }
}

export async function mapWithConcurrency<T, R>(items: readonly T[], worker: (item: T, index: number) => Promise<R>, limit = MAX_PUBLIC_READ_CONCURRENCY): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("read concurrency must be positive");
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
