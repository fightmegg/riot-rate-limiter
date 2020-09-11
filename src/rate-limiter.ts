import Bottleneck from "bottleneck";
import { LimitType } from "./@types";
import { chainRateLimiters, createRateLimiterOptions } from "./utils";

export const createRateLimiters = (
  rateLimits: {
    limits: string;
    counts: string;
  },
  opts: Bottleneck.ConstructorOptions
): { limiters?: Bottleneck[]; main?: Bottleneck } => {
  const { limits, counts } = rateLimits;
  const limitsArr = limits.split(",");
  const countsArr = counts.split(",");

  const rateLimiters: { limiters?: Bottleneck[]; main?: Bottleneck } = {};

  rateLimiters.limiters = limitsArr.map(
    (limit: string, index) =>
      new Bottleneck(
        createRateLimiterOptions(limit, countsArr[index], {
          ...opts,
          id: `${opts.id}_${index}`,
        })
      )
  );
  rateLimiters.limiters = chainRateLimiters(rateLimiters.limiters);
  rateLimiters.main = rateLimiters.limiters[0];

  return rateLimiters;
};

export const createRateLimitRetry = (limitType: LimitType[]) => (err: any) => {
  if (err.status === 429) {
    if (Array.isArray(limitType) && limitType.includes(err.limitType))
      return err.retryAfter;
    // if (err.limitType === limitType) return err.retryAfter >= 0 ? err.retryAfter : 5000;
  }
};

export const updateRateLimiters = (
  rateLimiters: Bottleneck[],
  rateLimits: { limits: string; counts: string }
): Bottleneck[] => {
  const { limits, counts } = rateLimits;
  const limitsArr = limits.split(",");
  const countsArr = counts.split(",");

  return rateLimiters.map((limiter: Bottleneck, index) => {
    limiter.updateSettings(
      createRateLimiterOptions(limitsArr[index], countsArr[index])
    );
    return limiter;
  });
};

export const synchronizeRateLimiters = async (
  rateLimiters: Bottleneck[],
  rateLimits: { limits: string; counts: string },
  methodCounts: Bottleneck.Counts
): Promise<Bottleneck[]> => {
  const { limits, counts } = rateLimits;
  const limitsArr = limits.split(",");
  const countsArr = counts.split(",");
  const requestsInFlight = methodCounts.EXECUTING;

  return Promise.all(
    rateLimiters.map(
      async (limiter: Bottleneck, index): Promise<Bottleneck> => {
        const currentReservoir = await limiter.currentReservoir();
        if (!currentReservoir) return limiter;

        const newRateLimits = createRateLimiterOptions(
          limitsArr[index],
          countsArr[index]
        );
        const rateLimitsLeftFromRiot =
          (newRateLimits.reservoirRefreshAmount || 0) -
          (newRateLimits.reservoir || 0);

        const newReservoir = Math.min(
          currentReservoir,
          rateLimitsLeftFromRiot - requestsInFlight
        );
        limiter.updateSettings({ reservoir: newReservoir });
        return limiter;
      }
    )
  );
};
