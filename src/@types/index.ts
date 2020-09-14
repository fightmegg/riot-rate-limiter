import Bottleneck from "bottleneck";
import { RequestInfo, RequestInit } from "node-fetch";

export interface ConstructorParams {
  debug?: boolean;
  redis?: Bottleneck.RedisConnectionOptions;
  concurrency?: number;
  retryAfterDefault?: number;
  retryCount?: number;
  datastore?: "local" | "ioredis";
}

export interface ExecuteParameters {
  url: RequestInfo;
  options: RequestInit;
}

export interface ExecuteRequestParameters {
  req: ExecuteParameters;
  region: PlatformId;
  method: string;
}

export enum PlatformId {
  EUW1 = "euw1",
  EUNE1 = "eun1",
  NA1 = "na1",
  LA1 = "la1",
  LA2 = "la2",
  KR = "kr",
  JP1 = "jp1",
  BR1 = "br1",
  OC1 = "oc1",
  RU = "ru",
  TR1 = "tr1",
  EUROPE = "europe",
  ASIA = "asia",
  SEA = "sea",
  AMERICAS = "americas",
  AP = "ap",
  BR = "br",
  EU = "eu",
  NA = "na",
  LATAM = "latam",
}

export enum LimitType {
  APPLICATION = "application",
  METHOD = "method",
  SERVICE = "service",
}

export interface RateLimits {
  appLimits: string;
  appCounts: string;
  methodLimits: string;
  methodCounts: string;
  limitType: LimitType | null;
  retryAfter: number | null;
}

export const HOST = ":platformId.api.riotgames.com";

export interface METHODS {
  ACCOUNT: {
    GET_BY_PUUID: string;
    GET_BY_RIOT_ID: string;
    GET_ACTIVE_SHARD_FOR_PLAYER: string;
  };
  CHAMPION_MASTERY: {
    GET_ALL_CHAMPIONS: string;
    GET_CHAMPION_MASTERY: string;
    GET_CHAMPION_MASTERY_SCORE: string;
  };
  CHAMPION: {
    GET_CHAMPION_ROTATIONS: string;
  };
  CLASH: {
    GET_PLAYERS_BY_SUMMONER: string;
    GET_TEAM: string;
    GET_TOURNAMENTS: string;
    GET_TOURNAMENT: string;
    GET_TOURNAMENT_TEAM: string;
  };
  LEAGUE_EXP: {
    GET_LEAGUE_ENTRIES: string;
  };
  LEAGUE: {
    GET_CHALLENGER_BY_QUEUE: string;
    GET_ENTRIES_BY_SUMMONER: string;
    GET_ALL_ENTRIES: string;
    GET_GRANDMASTER_BY_QUEUE: string;
    GET_LEAGUE_BY_ID: string;
    GET_MASTER_BY_QUEUE: string;
  };
  LOR_RANKED: {
    GET_MASTER_TIER: string;
  };
  MATCH: {
    GET_IDS_BY_TOURNAMENT_CODE: string;
    GET_MATCH_BY_ID: string;
    GET_MATCH_BY_ID_AND_TOURNAMENT_CODE: string;
    GET_MATCHLIST_BY_ACCOUNT: string;
    GET_TIMELINE_BY_MATCH_ID: string;
  };
  SPECTATOR: {
    GET_GAME_BY_SUMMONER_ID: string;
    GET_FEATURED_GAMES: string;
  };
  SUMMONER: {
    GET_BY_ACCOUNT_ID: string;
    GET_BY_SUMMONER_NAME: string;
    GET_BY_PUUID: string;
    GET_BY_SUMMONER_ID: string;
  };
  TFT_LEAGUE: {
    GET_CHALLENGER: string;
    GET_ENTRIES_BY_SUMMONER: string;
    GET_ALL_ENTRIES: string;
    GET_GRANDMASTER: string;
    GET_LEAGUE_BY_ID: string;
    GET_MASTER: string;
  };
  TFT_MATCH: {
    GET_MATCH_IDS_BY_PUUID: string;
    GET_MATCH_BY_ID: string;
  };
  TFT_SUMMONER: {
    GET_BY_ACCOUNT_ID: string;
    GET_BY_SUMMONER_NAME: string;
    GET_BY_PUUID: string;
    GET_BY_SUMMONER_ID: string;
  };
  THIRD_PARTY_CODE: {
    GET_BY_SUMMONER_ID: string;
  };
  TOURNAMENT_STUB: {
    POST_CREATE_CODES: string;
    GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE: string;
    POST_CREATE_PROVIDER: string;
    POST_CREATE_TOURNAMENT: string;
  };
  TOURNAMENT: {
    POST_CREATE_CODES: string;
    GET_TOURNAMENT_BY_CODE: string;
    PUT_TOURNAMENT_CODE: string;
    GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE: string;
    POST_CREATE_PROVIDER: string;
    POST_CREATE_TOURNAMENT: string;
  };
  VAL_CONTENT: {
    GET_CONTENT: string;
  };
  VAL_MATCH: {
    GET_MATCH_BY_ID: string;
    GET_MATCHLIST_BY_PUUID: string;
  };
  [key: string]: any;
}

export const METHODS: METHODS = {
  ACCOUNT: {
    GET_BY_PUUID: "/riot/account/v1/accounts/by-puuid/:puuid",
    GET_BY_RIOT_ID: "/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine",
    GET_ACTIVE_SHARD_FOR_PLAYER:
      "/riot/account/v1/active-shards/by-game/:game/by-puuid/:puuid",
  },
  CHAMPION_MASTERY: {
    GET_ALL_CHAMPIONS:
      "/lol/champion-mastery/v4/champion-masteries/by-summoner/:summonerId",
    GET_CHAMPION_MASTERY:
      "/lol/champion-mastery/v4/champion-masteries/by-summoner/:summonerId/by-champion/:championId",
    GET_CHAMPION_MASTERY_SCORE:
      "/lol/champion-mastery/v4/scores/by-summoner/:summonerId",
  },
  CHAMPION: {
    GET_CHAMPION_ROTATIONS: "/lol/platform/v3/champion-rotations",
  },
  CLASH: {
    GET_PLAYERS_BY_SUMMONER: "/lol/clash/v1/players/by-summoner/:summonerId",
    GET_TEAM: "/lol/clash/v1/teams/:teamId",
    GET_TOURNAMENTS: "/lol/clash/v1/tournaments",
    GET_TOURNAMENT: "/lol/clash/v1/tournaments/:tournamentId",
    GET_TOURNAMENT_TEAM: "/lol/clash/v1/tournaments/by-team/:teamId",
  },
  LEAGUE_EXP: {
    GET_LEAGUE_ENTRIES: "/lol/league-exp/v4/entries/:queue/:tier/:division",
  },
  LEAGUE: {
    GET_CHALLENGER_BY_QUEUE: "/lol/league/v4/challengerleagues/by-queue/:queue",
    GET_ENTRIES_BY_SUMMONER: "/lol/league/v4/entries/by-summoner/:summonerId",
    GET_ALL_ENTRIES: "/lol/league/v4/entries/:queue/:tier/:division",
    GET_GRANDMASTER_BY_QUEUE:
      "/lol/league/v4/grandmasterleagues/by-queue/:queue",
    GET_LEAGUE_BY_ID: "/lol/league/v4/leagues/:leagueId",
    GET_MASTER_BY_QUEUE: "/lol/league/v4/masterleagues/by-queue/:queue",
  },
  LOR_RANKED: {
    GET_MASTER_TIER: "/lor/ranked/v1/leaderboards",
  },
  MATCH: {
    GET_IDS_BY_TOURNAMENT_CODE:
      "/lol/match/v4/matches/by-tournament-code/:tournamentCode/ids",
    GET_MATCH_BY_ID: "/lol/match/v4/matches/:matchId",
    GET_MATCH_BY_ID_AND_TOURNAMENT_CODE:
      "/lol/match/v4/matches/:matchId/by-tournament-code/:tournamentCode",
    GET_MATCHLIST_BY_ACCOUNT: "/lol/match/v4/matchlists/by-account/:accountId",
    GET_TIMELINE_BY_MATCH_ID: "/lol/match/v4/timelines/by-match/:matchId",
  },
  SPECTATOR: {
    GET_GAME_BY_SUMMONER_ID:
      "/lol/spectator/v4/active-games/by-summoner/:summonerId",
    GET_FEATURED_GAMES: "/lol/spectator/v4/featured-games",
  },
  SUMMONER: {
    GET_BY_ACCOUNT_ID: "/lol/summoner/v4/summoners/by-account/:accountId",
    GET_BY_SUMMONER_NAME: "/lol/summoner/v4/summoners/by-name/:summonerName",
    GET_BY_PUUID: "/lol/summoner/v4/summoners/by-puuid/:puuid",
    GET_BY_SUMMONER_ID: "/lol/summoner/v4/summoners/:summonerId",
  },
  TFT_LEAGUE: {
    GET_CHALLENGER: "/tft/league/v1/challenger",
    GET_ENTRIES_BY_SUMMONER: "/tft/league/v1/entries/by-summoner/:summonerId",
    GET_ALL_ENTRIES: "/tft/league/v1/entries/:tier/:division",
    GET_GRANDMASTER: "/tft/league/v1/grandmaster",
    GET_LEAGUE_BY_ID: "/tft/league/v1/leagues/:leagueId",
    GET_MASTER: "/tft/league/v1/master",
  },
  TFT_MATCH: {
    GET_MATCH_IDS_BY_PUUID: "/tft/match/v1/matches/by-puuid/:puuid/ids",
    GET_MATCH_BY_ID: "/tft/match/v1/matches/:matchId",
  },
  TFT_SUMMONER: {
    GET_BY_ACCOUNT_ID: "/tft/summoner/v1/summoners/by-account/:accountId",
    GET_BY_SUMMONER_NAME: "/tft/summoner/v1/summoners/by-name/:summonerName",
    GET_BY_PUUID: "/tft/summoner/v1/summoners/by-puuid/:puuid",
    GET_BY_SUMMONER_ID: "/tft/summoner/v1/summoners/:summonerId",
  },
  THIRD_PARTY_CODE: {
    GET_BY_SUMMONER_ID:
      "/lol/platform/v4/third-party-code/by-summoner/:summonerId",
  },
  TOURNAMENT_STUB: {
    POST_CREATE_CODES: "/lol/tournament-stub/v4/codes",
    GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE:
      "/lol/tournament-stub/v4/lobby-events/by-code/:tournamentCode",
    POST_CREATE_PROVIDER: "/lol/tournament-stub/v4/providers",
    POST_CREATE_TOURNAMENT: "/lol/tournament-stub/v4/tournaments",
  },
  TOURNAMENT: {
    POST_CREATE_CODES: "/lol/tournament/v4/codes",
    GET_TOURNAMENT_BY_CODE: "/lol/tournament/v4/codes/:tournamentCode",
    PUT_TOURNAMENT_CODE: "/lol/tournament/v4/codes/:tournamentCode",
    GET_LOBBY_EVENTS_BY_TOURNAMENT_CODE:
      "/lol/tournament/v4/lobby-events/by-code/:tournamentCode",
    POST_CREATE_PROVIDER: "/lol/tournament/v4/providers",
    POST_CREATE_TOURNAMENT: "/lol/tournament/v4/tournaments",
  },
  VAL_CONTENT: {
    GET_CONTENT: "/val/content/v1/contents",
  },
  VAL_MATCH: {
    GET_MATCH_BY_ID: "/val/match/v1/matches/:matchId",
    GET_MATCHLIST_BY_PUUID: "/val/match/v1/matchlists/by-puuid/:puuid",
  },
};
