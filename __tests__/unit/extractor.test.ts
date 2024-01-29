import { compile } from "path-to-regexp";
import { PlatformId, METHODS, HOST } from "../../src/@types";
import { extractRegion, extractMethod } from "../../src/extractor";

describe("Extractor", () => {
  describe("extractRegion", () => {
    const toPath = compile(HOST, { encode: encodeURIComponent });

    test("it returns NULL if no region could be extracted", () => {
      expect(extractRegion("http://fightme.gg")).toBeNull();
    });

    test.each(Object.values(PlatformId))(
      "it extracts the correct region: %s",
      (region) => {
        expect(
          extractRegion(`https://${toPath({ platformId: region })}`)
        ).toEqual(region);
      }
    );
  });

  describe("extractMethod", () => {
    const url = "https://euw.api.riotgames.com";

    test("it returns NULL if no method could be extracted", () => {
      expect(extractMethod("http://fightme.gg/hello")).toBeNull();
    });

    test.each([
      // ACCOUNT
      ["ACCOUNT.GET_BY_PUUID", METHODS.ACCOUNT.GET_BY_PUUID, { puuid: "1234" }],
      [
        "ACCOUNT.GET_BY_RIOT_ID",
        METHODS.ACCOUNT.GET_BY_RIOT_ID,
        { gameName: "Demos Kratos", tagLine: "EUW" },
      ],
      ["ACCOUNT.GET_BY_ACCESS_TOKEN", METHODS.ACCOUNT.GET_BY_ACCESS_TOKEN, {}],
      [
        "ACCOUNT.GET_ACTIVE_SHARD_FOR_PLAYER",
        METHODS.ACCOUNT.GET_ACTIVE_SHARD_FOR_PLAYER,
        { game: "leagueOfLegends", puuid: "12345" },
      ],
      // CHAMPION MASTERY
      [
        "CHAMPION_MASTERY.GET_ALL_CHAMPIONS",
        METHODS.CHAMPION_MASTERY.GET_ALL_CHAMPIONS,
        { encryptedPUUID: "1234" },
      ],
      [
        "CHAMPION_MASTERY.GET_CHAMPION_MASTERY",
        METHODS.CHAMPION_MASTERY.GET_CHAMPION_MASTERY,
        { encryptedPUUID: "1234", championId: "53" },
      ],
      [
        "CHAMPION_MASTERY.GET_TOP_CHAMPIONS",
        METHODS.CHAMPION_MASTERY.GET_TOP_CHAMPIONS,
        { encryptedPUUID: "1234" },
      ],
      [
        "CHAMPION_MASTERY.GET_CHAMPION_MASTERY_SCORE",
        METHODS.CHAMPION_MASTERY.GET_CHAMPION_MASTERY_SCORE,
        { encryptedPUUID: "1234" },
      ],
      // CHAMPIONS
      [
        "CHAMPION.GET_CHAMPION_ROTATIONS",
        METHODS.CHAMPION.GET_CHAMPION_ROTATIONS,
        {},
      ],
      // CLASH
      [
        "CLASH.GET_PLAYERS_BY_PUUID",
        METHODS.CLASH.GET_PLAYERS_BY_PUUID,
        { puuid: "3333" },
      ],
      [
        "CLASH.GET_PLAYERS_BY_SUMMONER",
        METHODS.CLASH.GET_PLAYERS_BY_SUMMONER,
        { summonerId: "1234" },
      ],
      ["CLASH.GET_TEAM", METHODS.CLASH.GET_TEAM, { teamId: "1234" }],
      ["CLASH.GET_TOURNAMENTS", METHODS.CLASH.GET_TOURNAMENTS, {}],
      [
        "CLASH.GET_TOURNAMENT",
        METHODS.CLASH.GET_TOURNAMENT,
        { tournamentId: "1234" },
      ],
      [
        "CLASH.GET_TOURNAMENT_TEAM",
        METHODS.CLASH.GET_TOURNAMENT_TEAM,
        { teamId: "1234" },
      ],
      // LEAGUE EXP
      [
        "LEAGUE_EXP.GET_LEAGUE_ENTRIES",
        METHODS.LEAGUE_EXP.GET_LEAGUE_ENTRIES,
        { queue: "RANKED_SOLO_5v5", tier: "SILVER", division: "I" },
      ],
      // LEAGUE
      [
        "LEAGUE.GET_CHALLENGER_BY_QUEUE",
        METHODS.LEAGUE.GET_CHALLENGER_BY_QUEUE,
        { queue: "RANKED_SOLO_5v5" },
      ],
      [
        "LEAGUE.GET_ENTRIES_BY_SUMMONER",
        METHODS.LEAGUE.GET_ENTRIES_BY_SUMMONER,
        { summonerId: "1234" },
      ],
      [
        "LEAGUE.GET_ALL_ENTRIES",
        METHODS.LEAGUE.GET_ALL_ENTRIES,
        { queue: "RANKED_SOLO_5v5", tier: "SILVER", division: "I" },
      ],
      [
        "LEAGUE.GET_GRANDMASTER_BY_QUEUE",
        METHODS.LEAGUE.GET_GRANDMASTER_BY_QUEUE,
        { queue: "RANKED_SOLO_5v5" },
      ],
      [
        "LEAGUE.GET_LEAGUE_BY_ID",
        METHODS.LEAGUE.GET_LEAGUE_BY_ID,
        { leagueId: "1234" },
      ],
      [
        "LEAGUE.GET_MASTER_BY_QUEUE",
        METHODS.LEAGUE.GET_MASTER_BY_QUEUE,
        { queue: "RANKED_SOLO_5v5" },
      ],
      // LOL-CHALLENGES-V1
      ["LOL_CHALLENGES.GET_CONFIG", METHODS.LOL_CHALLENGES.GET_CONFIG, {}],
      [
        "LOL_CHALLENGES.GET_PERCENTILES",
        METHODS.LOL_CHALLENGES.GET_PERCENTILES,
        {},
      ],
      [
        "LOL_CHALLENGES.GET_CONFIG_BY_ID",
        METHODS.LOL_CHALLENGES.GET_CONFIG_BY_ID,
        { challengeId: "1234" },
      ],
      [
        "LOL_CHALLENGES.GET_LEADERBOARD_BY_ID",
        METHODS.LOL_CHALLENGES.GET_LEADERBOARD_BY_ID,
        { challengeId: "1234", level: "1" },
      ],
      [
        "LOL_CHALLENGES.GET_PERCENTILES_BY_ID",
        METHODS.LOL_CHALLENGES.GET_PERCENTILES_BY_ID,
        { challengeId: "1234" },
      ],
      [
        "LOL_CHALLENGES.GET_PLAYER_DATA_BY_PUUID",
        METHODS.LOL_CHALLENGES.GET_PLAYER_DATA_BY_PUUID,
        { puuid: "1234" },
      ],
      // LOR_DECK
      [
        "LOR_DECK.GET_DECKS_FOR_PLAYER",
        METHODS.LOR_DECK.GET_DECKS_FOR_PLAYER,
        {},
      ],
      // [
      //   "LOR_DECK.POST_CREATE_DECK_FOR_PLAYER",
      //   METHODS.LOR_DECK.POST_CREATE_DECK_FOR_PLAYER,
      //   {},
      // ],
      // LOR_INVENTORY
      [
        "LOR_INVENTORY.GET_CARDS_OWNED_BY_PLAYER",
        METHODS.LOR_INVENTORY.GET_CARDS_OWNED_BY_PLAYER,
        {},
      ],
      // LOR_MATCH
      [
        "LOR_MATCH.GET_MATCH_IDS_BY_PUUID",
        METHODS.LOR_MATCH.GET_MATCH_IDS_BY_PUUID,
        { puuid: "1234" },
      ],
      [
        "LOR_MATCH.GET_MATCH_BY_ID",
        METHODS.LOR_MATCH.GET_MATCH_BY_ID,
        { matchId: "1234" },
      ],
      // LOR_RANKED
      ["LOR_RANKED.GET_MASTER_TIER", METHODS.LOR_RANKED.GET_MASTER_TIER, {}],
      // MATCH
      [
        "MATCH.GET_IDS_BY_TOURNAMENT_CODE",
        METHODS.MATCH.GET_IDS_BY_TOURNAMENT_CODE,
        { tournamentCode: 1234 },
      ],
      [
        "MATCH.GET_MATCH_BY_ID",
        METHODS.MATCH.GET_MATCH_BY_ID,
        { matchId: "1234" },
      ],
      [
        "MATCH.GET_MATCH_BY_ID_AND_TOURNAMENT_CODE",
        METHODS.MATCH.GET_MATCH_BY_ID_AND_TOURNAMENT_CODE,
        { matchId: "1234", tournamentCode: 1234 },
      ],
      [
        "MATCH.GET_MATCHLIST_BY_ACCOUNT",
        METHODS.MATCH.GET_MATCHLIST_BY_ACCOUNT,
        { accountId: "12334" },
      ],
      [
        "MATCH.GET_TIMELINE_BY_MATCH_ID",
        METHODS.MATCH.GET_TIMELINE_BY_MATCH_ID,
        { matchId: "1234" },
      ],
      // MATCH V5
      [
        "MATCH_V5.GET_IDS_BY_PUUID",
        METHODS.MATCH_V5.GET_IDS_BY_PUUID,
        { puuid: "1234" },
      ],
      [
        "MATCH_V5.GET_MATCH_BY_ID",
        METHODS.MATCH_V5.GET_MATCH_BY_ID,
        { matchId: "1234" },
      ],
      [
        "MATCH_V5.GET_MATCH_TIMELINE_BY_ID",
        METHODS.MATCH_V5.GET_MATCH_TIMELINE_BY_ID,
        { matchId: "1234" },
      ],
      // SPECTATOR
      [
        "SPECTATOR.GET_GAME_BY_SUMMONER_ID",
        METHODS.SPECTATOR.GET_GAME_BY_SUMMONER_ID,
        { summonerId: "1234" },
      ],
      [
        "SPECTATOR.GET_FEATURED_GAMES",
        METHODS.SPECTATOR.GET_FEATURED_GAMES,
        {},
      ],
      // SUMMONER
      [
        "SUMMONER.GET_BY_RSO_PUUID",
        METHODS.SUMMONER.GET_BY_RSO_PUUID,
        { rsoPuuid: "1234" },
      ],
      [
        "SUMMONER.GET_BY_ACCOUNT_ID",
        METHODS.SUMMONER.GET_BY_ACCOUNT_ID,
        { accountId: "1234" },
      ],
      [
        "SUMMONER.GET_BY_SUMMONER_NAME",
        METHODS.SUMMONER.GET_BY_SUMMONER_NAME,
        { summonerName: "Demos Kratos" },
      ],
      [
        "SUMMONER.GET_BY_PUUID",
        METHODS.SUMMONER.GET_BY_PUUID,
        { puuid: "12334" },
      ],
      [
        "SUMMONER.GET_BY_SUMMONER_ID",
        METHODS.SUMMONER.GET_BY_SUMMONER_ID,
        { summonerId: "1234" },
      ],
      [
        "SUMMONER.GET_BY_ACCESS_TOKEN",
        METHODS.SUMMONER.GET_BY_ACCESS_TOKEN,
        {},
      ],
      // TFT LEAGUE
      ["TFT_LEAGUE.GET_CHALLENGER", METHODS.TFT_LEAGUE.GET_CHALLENGER, {}],
      [
        "TFT_LEAGUE.GET_ENTRIES_BY_SUMMONER",
        METHODS.TFT_LEAGUE.GET_ENTRIES_BY_SUMMONER,
        { summonerId: "1234" },
      ],
      [
        "TFT_LEAGUE.GET_ALL_ENTRIES",
        METHODS.TFT_LEAGUE.GET_ALL_ENTRIES,
        { tier: "SILVER", division: "I" },
      ],
      ["TFT_LEAGUE.GET_GRANDMASTER", METHODS.TFT_LEAGUE.GET_GRANDMASTER, {}],
      [
        "TFT_LEAGUE.GET_LEAGUE_BY_ID",
        METHODS.TFT_LEAGUE.GET_LEAGUE_BY_ID,
        { leagueId: "1234" },
      ],
      ["TFT_LEAGUE.GET_MASTER", METHODS.TFT_LEAGUE.GET_MASTER, {}],
      [
        "TFT_LEAGUE.GET_TOP_RATED_LADDER_BY_QUEUE",
        METHODS.TFT_LEAGUE.GET_TOP_RATED_LADDER_BY_QUEUE,
        { queue: "RANKED_TFT_TURBO" },
      ],
      // TFT_MATCH
      [
        "TFT_MATCH.GET_MATCH_IDS_BY_PUUID",
        METHODS.TFT_MATCH.GET_MATCH_IDS_BY_PUUID,
        { puuid: "1234" },
      ],
      [
        "TFT_MATCH.GET_MATCH_BY_ID",
        METHODS.TFT_MATCH.GET_MATCH_BY_ID,
        { matchId: "1234" },
      ],
      // TFT_SUMMONER
      [
        "TFT_SUMMONER.GET_BY_ACCOUNT_ID",
        METHODS.TFT_SUMMONER.GET_BY_ACCOUNT_ID,
        { accountId: "1234" },
      ],
      [
        "TFT_SUMMONER.GET_BY_SUMMONER_NAME",
        METHODS.TFT_SUMMONER.GET_BY_SUMMONER_NAME,
        { summonerName: "Demos Kratos" },
      ],
      [
        "TFT_SUMMONER.GET_BY_PUUID",
        METHODS.TFT_SUMMONER.GET_BY_PUUID,
        { puuid: "1234" },
      ],
      [
        "TFT_SUMMONER.GET_BY_ACCESS_TOKEN",
        METHODS.TFT_SUMMONER.GET_BY_ACCESS_TOKEN,
        {},
      ],
      [
        "TFT_SUMMONER.GET_BY_SUMMONER_ID",
        METHODS.TFT_SUMMONER.GET_BY_SUMMONER_ID,
        { summonerId: "1234" },
      ],
      // THIRD_PARTY_CODE
      [
        "THIRD_PARTY_CODE.GET_BY_SUMMONER_ID",
        METHODS.THIRD_PARTY_CODE.GET_BY_SUMMONER_ID,
        { summonerId: "1234" },
      ],
      // TOURNAMENT_STUB
      [
        "TOURNAMENT_STUB.POST_CREATE_CODES",
        METHODS.TOURNAMENT_STUB.POST_CREATE_CODES,
        {},
      ],
      [
        "TOURNAMENT_STUB.GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE",
        METHODS.TOURNAMENT_STUB.GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE,
        { tournamentCode: 1234 },
      ],
      [
        "TOURNAMENT_STUB.POST_CREATE_PROVIDER",
        METHODS.TOURNAMENT_STUB.POST_CREATE_PROVIDER,
        {},
      ],
      [
        "TOURNAMENT_STUB.POST_CREATE_TOURNAMENT",
        METHODS.TOURNAMENT_STUB.POST_CREATE_TOURNAMENT,
        {},
      ],
      // TOURNAMENT
      [
        "TOURNAMENT.POST_CREATE_CODES",
        METHODS.TOURNAMENT.POST_CREATE_CODES,
        {},
      ],
      [
        "TOURNAMENT.GET_TOURNAMENT_BY_CODE",
        METHODS.TOURNAMENT.GET_TOURNAMENT_BY_CODE,
        { tournamentCode: 1234 },
      ],
      //   [
      //     "TOURNAMENT.PUT_TOURNAMENT_CODE",
      //     METHODS.TOURNAMENT.PUT_TOURNAMENT_CODE,
      //     { tournamentCode: 1234 },
      //   ],
      [
        "TOURNAMENT.GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE",
        METHODS.TOURNAMENT.GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE,
        { tournamentCode: 1234 },
      ],
      [
        "TOURNAMENT.POST_CREATE_PROVIDER",
        METHODS.TOURNAMENT.POST_CREATE_PROVIDER,
        {},
      ],
      [
        "TOURNAMENT.POST_CREATE_TOURNAMENT",
        METHODS.TOURNAMENT.POST_CREATE_TOURNAMENT,
        {},
      ],
      // VAL_CONTENT
      ["VAL_CONTENT.GET_CONTENT", METHODS.VAL_CONTENT.GET_CONTENT, {}],
      // VAL_MATCH
      [
        "VAL_MATCH.GET_MATCH_BY_ID",
        METHODS.VAL_MATCH.GET_MATCH_BY_ID,
        { matchId: "1234" },
      ],
      [
        "VAL_MATCH.GET_MATCHLIST_BY_PUUID",
        METHODS.VAL_MATCH.GET_MATCHLIST_BY_PUUID,
        { puuid: "1234" },
      ],
      // VAL_RANKED
      [
        "VAL_RANKED.GET_LEADERBOARD_BY_QUEUE",
        METHODS.VAL_RANKED.GET_LEADERBOARD_BY_QUEUE,
        { actId: "1234" },
      ],
    ])("it extracts the correct method: %s", (method, path, args) => {
      const toPath = compile(path, { encode: encodeURIComponent });
      expect(extractMethod(`${url}${toPath(args)}`)).toEqual(method);
    });
  });
});
