import type { Config } from "@jest/types";

process.env.X_RIOT_API_KEY = "";
process.env.PUUID =
  "JjKdGcffExfOCsfimlsP2QOnoXA-lZCJL9jM2KeLkmEw6UGxi1ZguLAEaCs_eOY3zJeyaZO1KmcMDQ";
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
