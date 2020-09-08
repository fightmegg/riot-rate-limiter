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
  - [How does this library work?](#how-does-this-library-work)
      - [What happens when l call .execute?](#what-happens-when-l-call-execute)
      - [What exactly are the rate-limiters?](#what-exactly-are-the-rate-limiters)
      - [How do you handle 429?](#how-do-you-handle-429)
  - [Upcoming Features](#upcoming-features)

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

```ts
limiter.execute({
  url: RequestInfo,
  options: RequestInit,
});
```

#### `.rateLimiters`

This is a **map** of all of the rate-limiters created, we create at least 1 rate-limiter for the **region** of the request, and then at least 1 rate-limiter per **method** underneath that region.

We use the library [Bottleneck](https://github.com/SGrondin/bottleneck) as our rate-limiter, which supports chaining rate-limiters, meaning that the parents rate-limiter is always respected by its children.

You can access the **region** rate-limiters via: `limiter.rateLimiters[region].main` and you can access the method rate-limiters via: `limiter.rateLimiters[region][method].main`

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
import { extractRegion } from "@fightmegg/riot-rate-limiter";

extractRegion(
  "https://na1.api.riotgames.com/lol/champion-mastery/v4/scores/by-summoner/12345"
); // returns 'CHAMPION_MASTERY.GET_CHAMPION_MASTERY_SCORE'
```

#### METHODS & HOST

For those looking to build an `RiotGamesAPI` library ontop of this rate limiter, we export two object called [METHODS & HOST](). You can use these exports to create the URLs for you, as seen below:

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

## How does this library work?

Please see the [wiki]() for an up-to-date list of questions and answers

#### What happens when l call .execute?

In order to be fully transparent, we will try to explain exactly what this library does.

1. When you first call `limiter.execute`, we process the request, and then on the response, we setup all of the rate-limiters, respecting the `X-Rate-...` headers provided by the API.
2. Any subsequent calls to `limiter.execute` are then fully processed by the rate-limiters. We do this because we decided not to make a _ghost_ request, and to respect your given rate limits.

#### What exactly are the rate-limiters?

Each region or method may have multiple rate-limiters because Riot often return multiple limits on an API, e.g. `1:120,9000:1000`, which can mean 1 request every 120 seconds, and 9000 requests every 10 minutes.

In order to tie these together, we decided to break each limit into its own rate-limiter. Hence why we chose the library [Bottleneck](https://github.com/SGrondin/bottleneck), as its a fully features and well tested rate-limiter, that also supports chaining rate-limiters, so that we can form a hierachy.

So the hierarchy is: **App Rate Limiter** -> **Method Rate Limiter**.

#### How do you handle 429?

If a `429` is received, we automatically retry depending on a few things:

1. Which rate-limit did we hit? Application? Method? Serivce? This tells use which rate-limiter should be in charge of the retry
2. We then use the `Retry-After` header to determine when to retry next
3. Finally we schedule the **retry** and also update all of our affected rate-limiters with the latest rate-limits from the headers present on the request that returned a `429`.

## Upcoming Features

- [ ] Improve documentation
- [ ] Support Redis for multi-instance / cluster
- [ ] Support Redis / Bottleneck options to be passed / overridden
