import Bottleneck from "bottleneck";
import {
  ConstructorParams,
  ExecuteParameters,
  ExecuteRequestParameters,
  LimitType,
  PlatformId,
  RateLimits,
  METHODS,
  HOST,
} from "./@types";
import { extractMethod, extractRegion } from "./extractor";
import {
  createRateLimiters,
  createRateLimitRetry,
  synchronizeRateLimiters,
  updateRateLimiters,
} from "./rate-limiter";
import { request } from "./request";
import { createJobOptions } from "./utils";

const debug = require("debug")("riotratelimiter:main");
const debugQ = require("debug")("riotratelimiter:queue");

export { extractMethod, extractRegion, METHODS, HOST, PlatformId };

export class RiotRateLimiter {
  readonly configuration: {
    debug: boolean;
    concurrency: number;
    retryAfterDefault: number;
    retryCount: number;
    redis?: Bottleneck.RedisConnectionOptions;
    datastore: "local" | "redis" | "ioredis";
  } = {
    debug: false,
    concurrency: 1,
    retryAfterDefault: 5000,
    retryCount: 4,
    datastore: "local",
  };
  readonly rateLimiters: { [key: string]: any } = {};

  constructor(config: ConstructorParams = {}) {
    this.configuration = { ...this.configuration, ...config };
    this.checkConcurrency();
  }

  private checkConcurrency() {
    if (this.configuration.concurrency > 10)
      console.warn("Concurrency > 10 is quite high, be careful!");
  }

  private getRateLimiterOptions(id: string): Bottleneck.ConstructorOptions {
    return {
      id,
      maxConcurrent: this.configuration.concurrency,
      datastore: this.configuration.datastore,
      clientOptions: this.configuration.redis || null,
    };
  }

  private setupRateLimiters(
    region: PlatformId,
    method: string,
    rateLimits: RateLimits
  ): void {
    if (!this.rateLimiters[region] && rateLimits.appLimits) {
      debug("Setting up rateLimiter for", region);
      this.rateLimiters[region] = createRateLimiters(
        {
          limits: rateLimits.appLimits,
          counts: rateLimits.appCounts,
        },
        this.getRateLimiterOptions(region)
      );
      this.rateLimiters[region].main.on(
        "failed",
        createRateLimitRetry(
          [LimitType.APPLICATION],
          this.configuration.retryAfterDefault,
          this.configuration.retryCount
        )
      );
    }

    if (!this.rateLimiters[region]?.[method] && rateLimits.methodLimits) {
      debug("Setting up rateLimiter for", region, method);
      this.rateLimiters[region][method] = createRateLimiters(
        {
          limits: rateLimits.methodLimits,
          counts: rateLimits.methodCounts,
        },
        this.getRateLimiterOptions(`${region}_${method}`)
      );
      this.rateLimiters[region][method].main.on(
        "failed",
        createRateLimitRetry(
          [LimitType.METHOD, LimitType.SERVICE],
          this.configuration.retryAfterDefault,
          this.configuration.retryCount
        )
      );

      // TEMP DEBUG
      this.rateLimiters[region][method].main.on("debug", (msg: string) => {
        debugQ(
          region,
          method,
          msg,
          this.rateLimiters[region][method].main.counts()
        );
      });
    }
  }

  private updateRateLimiters(
    region: PlatformId,
    method: string,
    rateLimits: RateLimits
  ): void {
    if (this.rateLimiters[region]) {
      debug("Updating rateLimiter for", region);
      this.rateLimiters[region].limiters = updateRateLimiters(
        this.rateLimiters[region].limiters,
        { limits: rateLimits.appLimits, counts: rateLimits.appCounts }
      );
    }
    if (this.rateLimiters[region]?.[method]) {
      debug("Updating rateLimiter for", region, method);
      this.rateLimiters[region][method].limiters = updateRateLimiters(
        this.rateLimiters[region][method].limiters,
        { limits: rateLimits.methodLimits, counts: rateLimits.methodCounts }
      );
    }
  }

  private async syncRateLimiters(
    region: PlatformId,
    method: string,
    rateLimits: RateLimits
  ): Promise<void> {
    if (this.rateLimiters[region]?.[method]) {
      this.rateLimiters[region].limiters = await synchronizeRateLimiters(
        this.rateLimiters[region].limiters,
        { limits: rateLimits.appLimits, counts: rateLimits.appCounts },
        this.rateLimiters[region][method].main.counts()
      );

      this.rateLimiters[region][
        method
      ].limiters = await synchronizeRateLimiters(
        this.rateLimiters[region][method].limiters,
        { limits: rateLimits.methodLimits, counts: rateLimits.methodCounts },
        this.rateLimiters[region][method].main.counts()
      );
    }
    return;
  }

  async execute(
    req: ExecuteParameters,
    jobOptions?: Bottleneck.JobOptions
  ): Promise<any> {
    const region = extractRegion(req.url);
    const method = extractMethod(req.url);

    if (!region || !method)
      throw new Error(`unsupported region: ${region} or method: ${method}`);

    debug("Request:", req.url, "region:", region, "method:", method);

    const limiter = this.rateLimiters?.[region]?.[method];
    if (!limiter) {
      debug("No limiters setup yet, sending inital request");
      return this.executeRequest(
        { req, region, method },
        createJobOptions(jobOptions)
      );
    }

    return limiter.main.schedule(createJobOptions(jobOptions), () =>
      this.executeRequest({ req, region, method })
    );
  }

  private executeRequest(
    { req, region, method }: ExecuteRequestParameters,
    jobOptions?: Bottleneck.JobOptions
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      request(req)
        .then(({ rateLimits, json }) => {
          this.setupRateLimiters(region, method, rateLimits);
          this.syncRateLimiters(region, method, rateLimits).finally(() =>
            resolve(json)
          );
        })
        .catch(
          ({
            rateLimits,
            status,
            statusText,
            resp,
          }: {
            rateLimits: RateLimits;
            status: number;
            statusText: string;
            resp: Response;
          }) => {
            if (status !== 429) return reject(resp);

            const limiter = this.rateLimiters?.[region]?.[method];

            if (limiter) {
              this.updateRateLimiters(region, method, rateLimits);
              return reject({ status, statusText, ...rateLimits });
            }

            this.setupRateLimiters(region, method, rateLimits);
            setTimeout(() => {
              resolve(
                this.rateLimiters[region][method].main.schedule(
                  jobOptions,
                  () =>
                    this.executeRequest({
                      req,
                      region,
                      method,
                    })
                )
              );
            }, rateLimits.retryAfter || this.configuration.retryAfterDefault);
          }
        );
    });
  }
}
