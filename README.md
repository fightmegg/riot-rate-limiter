# Riot Rate Limiter

[![Version](https://img.shields.io/npm/v/@fightmegg/riot-rate-limiter.svg)](https://www.npmjs.com/package/@fightmegg/riot-rate-limiter)
[![Downloads](https://img.shields.io/npm/dm/@fightmegg/riot-rate-limiter.svg)](https://www.npmjs.com/package/@fightmegg/riot-rate-limiter)
[![CircleCI](https://circleci.com/gh/fightmegg/riot-rate-limiter/tree/master.svg?style=svg)](https://circleci.com/gh/fightmegg/riot-rate-limiter/tree/master)

> Node.JS Rate Limiter for [Riot Games API](https://developer.riotgames.com)

**[Wiki](https://github.com/fightmegg/riot-rate-limiter/wiki)**

### Features

- 100% Endpoint coverage
- **Spread** based rate-limiter
- [Request synchronization](https://github.com/fightmegg/riot-rate-limiter/wiki/Request-Synchronization)
- [Request prioritization](https://github.com/fightmegg/riot-rate-limiter/wiki/Request-Priorities)
- [429 response](https://github.com/fightmegg/riot-rate-limiter/wiki/429-Reponses) retrying
- [Concurrent requests](https://github.com/fightmegg/riot-rate-limiter/wiki/Concurrency)
- [429 Retry limit](https://github.com/fightmegg/riot-rate-limiter/wiki/Max-Retries)
- [Multi-instance / Cluster](<https://github.com/fightmegg/riot-rate-limiter/wiki/Multi-Instance---Cluster-(Redis)>) support
- Built specifically for [Riot Games Rate Limiting](https://web.archive.org/web/20190629194440/https://developer.riotgames.com/rate-limiting.html)

## Contents

- [Riot Rate Limiter](#riot-rate-limiter)
    - [Features](#features)
  - [Contents](#contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API](#api)
      - [`constructor`](#constructor)
      - [`.execute`](#execute)
      - [`.rateLimiters`](#ratelimiters)
  - [Helpers](#helpers)
      - [extractRegion](#extractregion)
      - [extractMethod](#extractmethod)
      - [METHODS & HOST](#methods--host)
  - [Debugging](#debugging)
  - [Testing](#testing)
  - [Maintainers](#maintainers)

## Installation

```shell
$ npm install @fightmegg/riot-rate-limiter
```

## Usage

```ts
import { RiotRateLimiter } from "@fightmegg/riot-rate-limiter";

const limiter = new RiotRateLimiter();

// async await
const response = await limiter.execute({
  url: "https://euw1.api.riotgames.com/lol/some/method",
  options: {
    headers: {
      "X-Riot-Token": "...",
    },
  },
});

// Promises
limiter
  .execute({
    url: "https://euw1.api.riotgames.com/lol/some/method",
    options: {
      headers: {
        "X-Riot-Token": "...",
      },
    },
  })
  .then((response) => {
    // ...
  });
```

## API

#### `constructor`

```ts
new RiotRateLimiter({
  debug: boolean = false,
  concurrency: number = 1,
  retryAfterDefault: number = 5000,
  retryCount: number = 4,
  datastore: 'local' | 'ioredis' = 'local'
  redis?: RedisConnectionOptions | RedisConnectionString = null
});
```

#### `.execute`

This library uses [node-fetch](https://github.com/node-fetch/node-fetch) underneath the hood for making requests. The `.execute` method literally passes everything given to **node-fetch**, therefore you can change things like _method_, _headers_ etc..

Any responses that are not 2xx or 429 will be thrown, and must be caught.

We will **auto-retry** `429` responses, up until the retryCount limit is hit (defaults to `4`), utilising the `Retry-After` header to respect the API.

```ts
limiter.execute({
  url: RequestInfo,
  options: RequestInit,
},
  jobOptions?: Bottleneck.JobOptions
);
```

The second argument is optional, which allows you to specify [JobOptions](https://github.com/SGrondin/bottleneck#job-options) such as job priority and unique ID for log identification. The weight of a job cannot be changed from the value of `1` no matter what you pass in.

#### `.rateLimiters`

This is a **map** of all of the rate-limiters created, we create at least 1 rate-limiter for the **region** of the request, and then at least 1 rate-limiter per **method** underneath that region.

We use the library [Bottleneck](https://github.com/SGrondin/bottleneck) as our rate-limiter, which supports chaining rate-limiters, meaning that the parents rate-limiter is always respected by its children.

You can access the **region** rate-limiters via: `limiter.rateLimiters[region].main` and you can access the **method** rate-limiters via: `limiter.rateLimiters[region][method].main`

## Helpers

We also provided some helper functions & objects.

#### extractRegion

This can extract the region or platformId from your URL:

```ts
import { extractRegion } from "@fightmegg/riot-rate-limiter";

extractRegion("https://na1.api.riotgames.com/method"); // returns na1
```

#### extractMethod

This can extract the method from your URL:

```ts
import { extractMethod } from "@fightmegg/riot-rate-limiter";

extractMethod(
  "https://na1.api.riotgames.com/lol/champion-mastery/v4/scores/by-summoner/12345"
); // returns 'CHAMPION_MASTERY.GET_CHAMPION_MASTERY_SCORE'
```

#### METHODS & HOST

For those looking to build a `RiotGamesAPI` library ontop of this rate limiter, we export two object called [METHODS & HOST](https://github.com/fightmegg/riot-rate-limiter/blob/master/%40types/index.ts#L58). You can use these exports to create the URLs for you, as seen below:

```ts
import { compile } from "path-to-regexp";
import { HOST, METHODS } from "@fightmegg/riot-rate-limiter";

const createHost = compile(HOST, { encode: encodeURIComponent });
const createPath = compile(METHODS.ACCOUNT.GET_BY_PUUID, {
  encode: encodeURIComponent,
});

const url = `https://${createHost({ platformId: "euw1" })}${createPath({
  puuid: "12345",
})}`;
```

## Debugging

If you want to see want the rate-limiter is currently doing, we use the [debug](https://github.com/visionmedia/debug) module for logging. Simply run your app with:

```shell
DEBUG=riotratelimiter* node ...
```

## Testing

Unit tests: `npm test`

E2E tests: `npm run test:e2e`

## Maintainers

[@olliejennings](https://github.com/olliejennings)
