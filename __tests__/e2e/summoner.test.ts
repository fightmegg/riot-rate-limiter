import "jest-extended";
import { compile } from "path-to-regexp";
import { PlatformId } from "../../@types";
import { RiotRateLimiter, METHODS, HOST } from "../../src/index";

const riotAPIKey = process.env.X_RIOT_API_KEY || "";

describe("E2E", () => {
  test("Get Summoner By SummonerName", async () => {
    const limiter = new RiotRateLimiter();

    const createHost = compile(HOST, { encode: encodeURIComponent });
    const createPath = compile(METHODS.SUMMONER.GET_BY_SUMMONER_NAME, {
      encode: encodeURIComponent,
    });
    const url = `https://${createHost({
      platformId: PlatformId.EUW1,
    })}${createPath({ summonerName: "Demos Kratos" })}`;
    const options = {
      headers: {
        "X-Riot-Token": riotAPIKey,
      },
    };
    const resp = await limiter.execute({ url, options });
    expect(resp.name).toEqual("Demos Kratos");
    expect(resp).toContainAllKeys([
      "id",
      "accountId",
      "puuid",
      "name",
      "profileIconId",
      "revisionDate",
      "summonerLevel",
    ]);
  });
});
