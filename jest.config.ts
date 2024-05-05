import type { Config } from "@jest/types";

process.env.RIOT_LOL_API_KEY = "661771";
process.env.PUUID = "";
const config: Config.InitialOptions = {
  verbose: true,
  coverageDirectory: ".jest/coverage",
  cacheDirectory: ".jest/cache",
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-extended/all"],
  preset: "ts-jest",
};

export default config;
