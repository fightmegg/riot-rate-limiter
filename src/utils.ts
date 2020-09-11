import Bottleneck from "bottleneck";
import { Headers } from "node-fetch";
import { LimitType, RateLimits } from "./@types";

const defaultRateLimiterOptions = {
  maxConcurrent: 1,
  strategy: Bottleneck.strategy.OVERFLOW,
};

export const createRateLimiterOptions = (
  limit: string,
  count: string,
  options?: Bottleneck.ConstructorOptions
): Bottleneck.ConstructorOptions => {
  const limits = limit.split(":").map(toNumber);
  const counts = count.split(":").map(toNumber);

  if (!limits.length || limits.length < 2)
    throw new Error("invalid rate limits");

  return {
    ...defaultRateLimiterOptions,
    ...(options || {}),
    reservoir: limits[0] - (counts[0] || 0),
    reservoirRefreshAmount: limits[0],
    reservoirRefreshInterval: secsToMs(limits[1]),
    minTime: secsToMs(limits[1]) / limits[0],
  };
};

export const createJobOptions = (
  options: Bottleneck.JobOptions = {}
): Bottleneck.JobOptions => ({
  id: String(Date.now()),
  ...options,
  weight: 1,
});

export const chainRateLimiters = (rl: Bottleneck[]) => {
  for (let i = rl.length - 1; i >= 0; i--) {
    if (rl[i - 1]) rl[i - 1].chain(rl[i]);
  }
  return rl;
};

export const secsToMs = (secs: number): number => secs * 1000;

export const toNumber = (n: string) => Number(n);

export const extractRateLimits = (headers: Headers): RateLimits => ({
  appLimits: headers.get("X-App-Rate-Limit") || "",
  appCounts: headers.get("X-App-Rate-Limit-Count") || "",
  methodLimits: headers.get("X-Method-Rate-Limit") || "",
  methodCounts: headers.get("X-Method-Rate-Limit-Count") || "",
  retryAfter: secsToMs(toNumber(headers.get("Retry-After") || "")),
  limitType: headers.get("X-Rate-Limit-Type") as LimitType,
});
