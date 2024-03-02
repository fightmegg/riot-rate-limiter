import "jest-extended";
import {
  RiotRateLimiter,
  extractMethod,
  extractRegion,
  METHODS,
  HOST,
} from "../../src/index";
import nock from "nock";
import Bottleneck from "bottleneck";

describe("@fightmegg/riot-rate-limtier", () => {
  describe.each([
    ["RiotRateLimiter", RiotRateLimiter, Object],
    ["extractRegion", extractRegion, Function],
    ["extractMethod", extractMethod, Function],
    ["METHODS", METHODS, Object],
  ])("%s", (name, type, instance) => {
    test("it is exported", () => {
      expect(type).toBeInstanceOf(instance);
    });
  });

  describe("HOST", () => {
    test("it is exported", () => {
      expect(HOST).toBeString();
    });
  });

  describe("RiotRateLimiter", () => {
    let limiter: RiotRateLimiter;

    const rateLimitHeaders = {
      "X-App-Rate-Limit": "20:1,100:120",
      "X-App-Rate-Limit-Count": "1:1,3:120",
      "X-Method-Rate-Limit": "2000:60",
      "X-Method-Rate-Limit-Count": "1:1,3:120",
    };
    const host = "https://euw1.api.riotgames.com";
    const path =
      "/lol/champion-mastery/v4/champion-masteries/by-puuid/12345";

    beforeEach(() => {
      jest.resetAllMocks();
      limiter = new RiotRateLimiter();
    });

    afterAll(() => {
      nock.restore();
    });

    test("initialization sets default class variables", () => {
      expect(limiter.configuration.debug).toBeFalse();
      expect(limiter.configuration.concurrency).toEqual(1);
      expect(limiter.configuration.retryAfterDefault).toEqual(5000);
      expect(limiter.configuration.retryCount).toEqual(4);
      expect(limiter.rateLimiters).toEqual({});
    });

    test("initialization overrides default class variables if passed in", () => {
      const r = new RiotRateLimiter({
        debug: true,
        concurrency: 10,
        retryAfterDefault: 2000,
        retryCount: 2,
      });
      expect(r.configuration.debug).toBeTrue();
      expect(r.configuration.concurrency).toEqual(10);
      expect(r.configuration.retryAfterDefault).toEqual(2000);
      expect(r.configuration.retryCount).toEqual(2);
    });

    test("should THROW if unsupported region", async () => {
      const req = {
        url: "https://northkorea.api.riotgames.com/non/existant/method",
        options: {},
      };
      await expect(limiter.execute(req)).rejects.toThrowError(
        "unsupported region: northkorea or method: null"
      );
    });

    test("should THROW with unsupported method", async () => {
      const req = {
        url: "https://euw1.api.riotgames.com/non/existant/method",
        options: {},
      };
      await expect(limiter.execute(req)).rejects.toThrowError(
        "unsupported region: euw1 or method: null"
      );
    });

    test("should reject with response on non 2xx", async () => {
      const scope = nock(host).get(path).reply(403);
      const url = `${host}${path}`;

      try {
        await limiter.execute({ url, options: {} });
      } catch (e: any) {
        expect(scope.isDone()).toBeTrue();
        expect(e.status).toBe(403);
      }
    });

    test("should not setup any rateLimiters on a non 2xx & non 429", async () => {
      const scope = nock(host).get(path).reply(403);
      const url = `${host}${path}`;

      await expect(limiter.execute({ url, options: {} })).rejects.toBeTruthy();
      expect(scope.isDone()).toBeTrue();
      expect(limiter.rateLimiters).toEqual({});
    });

    test("should return data for 2xx response", async () => {
      const scope = nock(host)
        .get(path)
        .reply(200, { summonerName: "Demos Kratos" });
      const url = `${host}${path}`;

      const resp = await limiter.execute({ url, options: {} });
      expect(scope.isDone()).toBeTrue();
      expect(resp).toEqual({ summonerName: "Demos Kratos" });
    });

    test("should setup rateLimiters for 2xx response", async () => {
      const scope = nock(host)
        .get(path)
        .reply(200, { summonerName: "Demos Kratos" }, rateLimitHeaders);
      const url = `${host}${path}`;

      await limiter.execute({ url, options: {} });
      expect(scope.isDone()).toBeTrue();
      expect(limiter.rateLimiters?.euw1?.limiters).toHaveLength(2);
      expect(limiter.rateLimiters?.euw1?.main).toBeInstanceOf(Bottleneck);
      expect(
        limiter.rateLimiters?.euw1?.["CHAMPION_MASTERY.GET_ALL_CHAMPIONS"]
          ?.limiters
      ).toHaveLength(1);
      expect(
        limiter.rateLimiters?.euw1?.["CHAMPION_MASTERY.GET_ALL_CHAMPIONS"]?.main
      ).toBeInstanceOf(Bottleneck);
    });

    test("should return data for post request with 2xx response", async () => {
      const scope = nock(host)
        .post(path)
        .reply(200, { summonerName: "Demos Kratos" });
      const url = `${host}${path}`;

      const resp = await limiter.execute({ url, options: { method: "POST" } });
      expect(scope.isDone()).toBeTrue();
      expect(resp).toEqual({ summonerName: "Demos Kratos" });
    });

    test.todo(
      "should setup rateLimiters for 429 response & retryAfter duration"
    );

    test.todo("should update rateLimiters for 2nd 429 response");
  });
});
