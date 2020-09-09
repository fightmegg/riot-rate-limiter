# Riot Rate Limiter

> Node.JS Rate Limiter for [Riot Games API](https://developer.riotgames.com)

### What this library is not

- An API for interfacing with the Riot Games API
- Interfacing with non rate-limited endpoints

### What this library is

- A low level rate-limiter specifically built for [Riot Games Rate Limiting](https://web.archive.org/web/20190629194440/https://developer.riotgames.com/rate-limiting.html)
- A **spread** based rate-limiter

## Contents

- [Riot Rate Limiter](#riot-rate-limiter)
    - [What this library is not](#what-this-library-is-not)
    - [What this library is](#what-this-library-is)
  - [Contents](#contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Endpoints Covered](#endpoints-covered)
  - [API](#api)
      - [`.execute`](#execute)
      - [`.rateLimiters`](#ratelimiters)
  - [Helpers](#helpers)
      - [extractRegion](#extractregion)
      - [extractMethod](#extractmethod)
      - [METHODS & HOST](#methods--host)
  - [Wiki](#wiki)
  - [Testing](#testing)
  - [Upcoming Features](#upcoming-features)
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

## Endpoints Covered

Currently supports all endpoints listed on the [Riot Games API](https://developer.riotgames.com/apis) docs

## API

#### `.execute`

This library uses [node-fetch](https://github.com/node-fetch/node-fetch) underneath the hood for making requests. The `.execute` method literally passes everything given to **node-fetch**, therefore you can change things like _method_, _headers_ etc..

Any responses that are not 2xx or 429 will be thrown, and must be caught.

We will **auto-retry** `429` responses, utilising the `Retry-After` header to respect the API.

```ts
limiter.execute({
  url: RequestInfo,
  options: RequestInit,
});
```

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

## Wiki

Please see the [wiki](https://github.com/fightmegg/riot-rate-limiter/wiki) for an up-to-date list of questions and answers

## Testing

Unit tests: `npm test __tests__/unit`

E2E tests: `npm test __tests__/e2e`

## Upcoming Features

- [ ] Improve documentation
- [ ] Add more tests
- [ ] Support Redis for multi-instance / cluster
- [ ] Support Redis / Bottleneck options to be passed / overridden
- [ ] Potentially look into interceptors

## Maintainers

[@olliejennings](https://github.com/olliejennings)
