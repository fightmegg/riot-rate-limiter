import { Substitute } from "@fluffy-spoon/substitute";
import Bottleneck from "bottleneck";
import { mocked } from "ts-jest/utils";
import { LimitType } from "../../src/@types";
import {
  createRateLimiters,
  createRateLimitRetry,
  updateRateLimiters,
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
      expect(createRateLimitRetry([LimitType.APPLICATION])).toBeInstanceOf(
        Function
      );
    });

    test("it should return undefined if status !== 429", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION]);
      expect(retry({ status: 400 })).toBeUndefined();
    });

    test("it should return undefined if status === 429 but limitType does not exist", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION]);
      expect(retry({ status: 429, limitType: "something" })).toBeUndefined();
    });

    test("it should return undefined if status === 429 but limitType does not match", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION]);
      expect(
        retry({ status: 429, limitType: LimitType.METHOD })
      ).toBeUndefined();
    });

    test("it should return retryAfter if status === 429 & limitType matches", () => {
      const retry = createRateLimitRetry([LimitType.APPLICATION]);
      expect(
        retry({
          status: 429,
          limitType: LimitType.APPLICATION,
          retryAfter: 5000,
        })
      ).toEqual(5000);
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

      const rls = createRateLimiters(rateLimits, "euw");
      expect(rls.main).toBeInstanceOf(Bottleneck);
      expect(rls.limiters).toHaveLength(2);
      expect(rls.main).toEqual(rls.limiters?.[0]);
      expect(mockedCreateRateLimiterOptions).toHaveBeenNthCalledWith(
        1,
        "10",
        "10",
        { id: "euw_0" }
      );
      expect(mockedCreateRateLimiterOptions).toHaveBeenNthCalledWith(
        2,
        "1",
        "1",
        { id: "euw_1" }
      );
      expect(mockedChainRateLimiters).toHaveBeenCalledWith(rls.limiters);
    });
  });
});
