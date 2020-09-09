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
  updateRateLimiters,
} from "./rate-limiter";
import { request } from "./request";

const debug = require("debug")("riotratelimiter:main");
const debugQ = require("debug")("riotratelimiter:queue");

export { extractMethod, extractRegion, METHODS, HOST };

export class RiotRateLimiter {
  readonly debug: boolean = false;
  readonly rateLimiters: { [key: string]: any } = {};

  constructor({ debug = false }: ConstructorParams = {}) {
    this.debug = debug;
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
        region
      );
      this.rateLimiters[region].main.on(
        "failed",
        createRateLimitRetry([LimitType.APPLICATION])
      );
    }
    if (!this.rateLimiters[region]?.[method] && rateLimits.methodLimits) {
      debug("Setting up rateLimiter for", region, method);
      this.rateLimiters[region][method] = createRateLimiters(
        {
          limits: rateLimits.methodLimits,
          counts: rateLimits.methodCounts,
        },
        `${region}_${method}}`
      );
      this.rateLimiters[region][method].main.on(
        "failed",
        createRateLimitRetry([LimitType.METHOD, LimitType.SERVICE])
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
    if (this.rateLimiters[region][method]) {
      debug("Updating rateLimiter for", region, method);
      this.rateLimiters[region][method].limiters = updateRateLimiters(
        this.rateLimiters[region][method].limiters,
        { limits: rateLimits.methodLimits, counts: rateLimits.methodCounts }
      );
    }
  }

  async execute(req: ExecuteParameters): Promise<any> {
    const region = extractRegion(req.url);
    const method = extractMethod(req.url);

    if (!region || !method)
      throw new Error(`unsupported region: ${region} or method: ${method}`);

    debug("Request:", req.url, "region:", region, "method:", method);

    const limiter = this.rateLimiters?.[region]?.[method];
    if (!limiter) {
      debug("No limiters setup yet, sending inital request");
      return this.executeRequest({ req, region, method });
    }

    return limiter.main.schedule({ id: Date.now() }, () =>
      this.executeRequest({ req, region, method })
    );
  }

  private executeRequest({
    req,
    region,
    method,
  }: ExecuteRequestParameters): Promise<any> {
    return new Promise((resolve, reject) => {
      request(req)
        .then(({ rateLimits, json }) => {
          this.setupRateLimiters(region, method, rateLimits);
          resolve(json);
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
            resp: any;
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
                  { id: Date.now() },
                  () => this.executeRequest({ req, region, method })
                )
              );
            }, rateLimits.retryAfter || 5000);
          }
        );
    });
  }
}
