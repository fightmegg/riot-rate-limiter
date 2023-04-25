import "jest-extended";
import { compile } from "path-to-regexp";
import { PlatformId } from "../../src/@types";
import { RiotRateLimiter, METHODS, HOST } from "../../src/index";

const riotAPIKey = process.env.X_RIOT_API_KEY || "";

describe("E2E", () => {
  test("Get MatchList By Account", async () => {
    const limiter = new RiotRateLimiter();

    const createHost = compile(HOST, { encode: encodeURIComponent });
    const createAccountPath = compile(METHODS.SUMMONER.GET_BY_SUMMONER_NAME, {
      encode: encodeURIComponent,
    });
    const createMatchListPath = compile(
      METHODS.MATCH.GET_MATCHLIST_BY_ACCOUNT,
      {
        encode: encodeURIComponent,
      }
    );

    const options = {
      headers: {
        "X-Riot-Token": riotAPIKey,
      },
    };
    const account = await limiter.execute({
      url: `https://${createHost({
        platformId: PlatformId.EUW1,
      })}${createAccountPath({ summonerName: "Demos Kratos" })}`,
      options,
    });
    const resp = await limiter.execute({
      url: `https://${createHost({
        platformId: PlatformId.EUW1,
      })}${createMatchListPath({
        accountId: account.accountId,
      })}?beginIndex=200`,
      options,
    });
    expect(resp).toContainAllKeys([
      "startIndex",
      "endIndex",
      "totalGames",
      "matches",
    ]);
  });

  test("Get MatchList By Not Found Account", async () => {
    const limiter = new RiotRateLimiter();

    const createHost = compile(HOST, { encode: encodeURIComponent });
    const createAccountPath = compile(METHODS.SUMMONER.GET_BY_SUMMONER_NAME, {
      encode: encodeURIComponent,
    });
    const createMatchListPath = compile(METHODS.MATCH_V5.GET_IDS_BY_PUUID, {
      encode: encodeURIComponent,
    });

    const options = {
      headers: {
        "X-Riot-Token": riotAPIKey,
      },
    };
    const account = await limiter.execute({
      url: `https://${createHost({
        platformId: PlatformId.EUW1,
      })}${createAccountPath({ summonerName: "Demos Kratos" })}`,
      options,
    });

    try {
      await limiter.execute({
        url: `https://${createHost({
          platformId: PlatformId.NA1,
        })}${createMatchListPath({
          puuid: account.puuid,
        })}?beginIndex=200`,
        options,
      });
    } catch (e: any) {
      expect(e.status).toEqual(404);
    }
  });
});
