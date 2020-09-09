import { Headers } from "node-fetch";
import { Substitute } from "@fluffy-spoon/substitute";
import { LimitType } from "../../src/@types";
import {
  toNumber,
  secsToMs,
  extractRateLimits,
  createRateLimiterOptions,
  chainRateLimiters,
} from "../../src/utils";
import Bottleneck from "bottleneck";

describe("Utils", () => {
  describe("toNumber", () => {
    test.each([
      ["1", 1],
      ["100", 100],
    ])("toNumber('%s') returns %d", (input, output) => {
      expect(toNumber(input)).toEqual(output);
    });
  });

  describe("secsToMS", () => {
    test.each([
      [1, 1000],
      [50, 50000],
    ])("secsToMs(%d) returns %d", (input, output) => {
      expect(secsToMs(input)).toEqual(output);
    });
  });

  describe("extractRateLimits", () => {
    test("it should extract App RateLimits", () => {
      const headers = new Headers({
        "X-App-Rate-Limit": "20:1,100:120",
        "X-App-Rate-Limit-Count": "1:1,3:120",
      });

      expect(extractRateLimits(headers)).toEqual({
        appLimits: "20:1,100:120",
        appCounts: "1:1,3:120",
        methodLimits: "",
        methodCounts: "",
        retryAfter: 0,
        limitType: null,
      });
    });

    test("it should extract Method RateLimits", () => {
      const headers = new Headers({
        "X-Method-Rate-Limit": "2000:60",
        "X-Method-Rate-Limit-Count": "1:1,3:120",
      });

      expect(extractRateLimits(headers)).toEqual({
        appLimits: "",
        appCounts: "",
        methodLimits: "2000:60",
        methodCounts: "1:1,3:120",
        retryAfter: 0,
        limitType: null,
      });
    });

    test("it should extract retryAfter", () => {
      const headers = new Headers({
        "Retry-After": "5",
      });

      expect(extractRateLimits(headers)).toEqual({
        appLimits: "",
        appCounts: "",
        methodLimits: "",
        methodCounts: "",
        retryAfter: 5000,
        limitType: null,
      });
    });

    test("it should extract limitType", () => {
      const headers = new Headers({
        "X-Rate-Limit-Type": "application",
      });

      expect(extractRateLimits(headers)).toEqual({
        appLimits: "",
        appCounts: "",
        methodLimits: "",
        methodCounts: "",
        retryAfter: 0,
        limitType: LimitType.APPLICATION,
      });
    });
  });

  describe("createRateLimitOptions", () => {
    test("it should THROW if invalid limits provided", () => {
      expect(() => createRateLimiterOptions("", "")).toThrowError(
        new Error("invalid rate limits")
      );
      expect(() => createRateLimiterOptions("1", "1")).toThrowError(
        new Error("invalid rate limits")
      );
    });

    test("it should return rateLimiterOptions", () => {
      expect(createRateLimiterOptions("100:20", "1:1")).toEqual({
        maxConcurrent: 1,
        strategy: 2,
        reservoir: 99,
        reservoirRefreshAmount: 100,
        reservoirRefreshInterval: 20000,
        minTime: 200,
      });
    });

    test("it should return rateLimiterOptions with no count", () => {
      expect(createRateLimiterOptions("100:20", "")).toEqual({
        maxConcurrent: 1,
        strategy: 2,
        reservoir: 100,
        reservoirRefreshAmount: 100,
        reservoirRefreshInterval: 20000,
        minTime: 200,
      });
    });

    test("it should return rateLimiterOptions with overrides", () => {
      expect(
        createRateLimiterOptions("100:20", "1:1", { id: "1", maxConcurrent: 4 })
      ).toEqual({
        id: "1",
        maxConcurrent: 4,
        strategy: 2,
        reservoir: 99,
        reservoirRefreshAmount: 100,
        reservoirRefreshInterval: 20000,
        minTime: 200,
      });
    });
  });

  describe("chainRateLimiters", () => {
    test("it should not call chain if only given 1 rateLimiter", () => {
      const mockRateLimiter1 = Substitute.for<Bottleneck>();
      chainRateLimiters([mockRateLimiter1]);
      mockRateLimiter1.received(0).chain();
    });

    test("it should call chain on the first rateLimiter only", () => {
      const mockRateLimiter1 = Substitute.for<Bottleneck>();
      const mockRateLimiter2 = Substitute.for<Bottleneck>();
      chainRateLimiters([mockRateLimiter1, mockRateLimiter2]);
      mockRateLimiter1.received(1).chain(mockRateLimiter2);
      mockRateLimiter2.received(0).chain();
    });
  });
});
