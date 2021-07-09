import { Substitute } from "@fluffy-spoon/substitute";
import Bottleneck from "bottleneck";
import { mocked } from "ts-jest/utils";
import { LimitType } from "../../src/@types";
import {
  createRateLimiters,
  createRateLimitRetry,
  updateRateLimiters,
  synchronizeRateLimiters,
} from "../../src/rate-limiter";
import { createRateLimiterOptions, chainRateLimiters } from "../../src/utils";

jest.mock("../../src/utils");
jest.mock("bottleneck");

describe("rate-limiter", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const mockedChainRateLimiters = mocked(chainRateLimiters);
  const mockedCreateRateLimiterOptions = mocked(createRateLimiterOptions);

  describe("createRateLimitRetry", () => {
    test("it should return a function", () => {
      expect(
        createRateLimitRetry([LimitType.APPLICATION], 2000, 2)
      ).toBeInstanceOf(Function);
    });

    test("it should return undefined if status !== 429", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION], 2000, 2);
      const jobInfo = { retryCount: 0 } as Bottleneck.EventInfoRetryable;
      expect(retry({ status: 400 }, jobInfo)).toBeUndefined();
    });

    test("it should return retryAfterDefault if status === 429 but limitType does not exist", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION], 2000, 2);
      const jobInfo = { retryCount: 0 } as Bottleneck.EventInfoRetryable;
      expect(retry({ status: 429, limitType: "something" }, jobInfo)).toEqual(
        2000
      );
    });

    test("it should return retryAfter if status === 429 & limitType matches", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION], 2000, 2);
      const jobInfo = { retryCount: 0 } as Bottleneck.EventInfoRetryable;
      expect(
        retry(
          {
            status: 429,
            limitType: LimitType.APPLICATION,
            retryAfter: 5000,
          },
          jobInfo
        )
      ).toEqual(5000);
    });

    test("it should return undefined if retryCount has passed retryLimit", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION], 2000, 2);
      const jobInfo = { retryCount: 1 } as Bottleneck.EventInfoRetryable;
      expect(
        retry(
          {
            status: 429,
            limitType: LimitType.APPLICATION,
            retryAfter: 5000,
          },
          jobInfo
        )
      ).toBeUndefined();
    });
  });

  describe("updateRateLimiters", () => {
    test("it should call updateSettings on each rate limiter", () => {
      mockedCreateRateLimiterOptions.mockReturnValue({ id: "1" });
      const rateLimiter = Substitute.for<Bottleneck>();
      const rateLimits = { limits: "10,1", counts: "10,1" };

      expect(updateRateLimiters([rateLimiter], rateLimits)).toBeInstanceOf(
        Array
      );
      expect(mockedCreateRateLimiterOptions).toHaveBeenNthCalledWith(
        1,
        "10",
        "10"
      );
      rateLimiter.received(1).updateSettings({ id: "1" });
    });
  });

  describe("createRateLimiters", () => {
    test("it should create 2 rateLimiters based on rateLimits passed in", () => {
      mockedCreateRateLimiterOptions.mockReturnValue({ id: "1" });
      mockedChainRateLimiters.mockImplementation((s) => s);

      const rateLimits = { limits: "10,1", counts: "10,1" };

      const rls = createRateLimiters(rateLimits, {
        id: "euw",
        maxConcurrent: 2,
      });
      expect(rls.main).toBeInstanceOf(Bottleneck);
      expect(rls.limiters).toHaveLength(2);
      expect(rls.main).toEqual(rls.limiters?.[0]);
      expect(mockedCreateRateLimiterOptions).toHaveBeenNthCalledWith(
        1,
        "10",
        "10",
        { id: "euw_0", maxConcurrent: 2 }
      );
      expect(mockedCreateRateLimiterOptions).toHaveBeenNthCalledWith(
        2,
        "1",
        "1",
        { id: "euw_1", maxConcurrent: 2 }
      );
      expect(mockedChainRateLimiters).toHaveBeenCalledWith(rls.limiters);
    });
  });

  describe("synchronizeRateLimiters", () => {
    test("it should not parse the rateLimits from Riot if current reservoir is empty", async () => {
      const rateLimiter = Substitute.for<Bottleneck>();
      const rateLimits = { limits: "100:10", counts: "9:10" };
      const counts = { EXECUTING: 0 } as Bottleneck.Counts;
      rateLimiter.currentReservoir().resolves(0);

      const rl = await synchronizeRateLimiters(
        [rateLimiter],
        rateLimits,
        counts
      );

      expect(rl).toEqual([rateLimiter]);
      expect(mockedCreateRateLimiterOptions).not.toHaveBeenCalled();
      rateLimiter.received().currentReservoir();
    });

    test("it should update the reservoir limits if the API returns higher limits", async () => {
      mockedCreateRateLimiterOptions.mockReturnValue({
        reservoirRefreshAmount: 10,
        reservoir: 7,
      });
      const rateLimiter = Substitute.for<Bottleneck>();
      const rateLimits = { limits: "10:10", counts: "3:10" };
      const counts = { EXECUTING: 0 } as Bottleneck.Counts;
      rateLimiter.currentReservoir().resolves(8);

      await synchronizeRateLimiters([rateLimiter], rateLimits, counts);

      expect(mockedCreateRateLimiterOptions).toHaveBeenCalledWith(
        "10:10",
        "3:10"
      );
      rateLimiter.received().updateSettings({ reservoir: 7 });
    });

    test("it should update the reservoir limits if the API returns lower limits", async () => {
      mockedCreateRateLimiterOptions.mockReturnValue({
        reservoirRefreshAmount: 10,
        reservoir: 3,
      });
      const rateLimiter = Substitute.for<Bottleneck>();
      const rateLimits = { limits: "10:10", counts: "7:10" };
      const counts = { EXECUTING: 0 } as Bottleneck.Counts;
      rateLimiter.currentReservoir().resolves(4);

      await synchronizeRateLimiters([rateLimiter], rateLimits, counts);

      rateLimiter.received().updateSettings({ reservoir: 3 });
    });

    test("it should update the reservoir limits if we have many requests inflight", async () => {
      mockedCreateRateLimiterOptions.mockReturnValue({
        reservoirRefreshAmount: 10,
        reservoir: 7,
      });
      const rateLimiter = Substitute.for<Bottleneck>();
      const rateLimits = { limits: "10:10", counts: "3:10" };
      const counts = { EXECUTING: 5 } as Bottleneck.Counts;
      rateLimiter.currentReservoir().resolves(8);

      await synchronizeRateLimiters([rateLimiter], rateLimits, counts);

      rateLimiter.received().updateSettings({ reservoir: 2 });
    });
  });
});
