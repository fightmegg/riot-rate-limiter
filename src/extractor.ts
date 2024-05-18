import { Key, pathToRegexp } from "path-to-regexp";
import { RequestInfo } from "node-fetch";
import { PlatformId, HOST, METHODS } from "./@types";

const matchPath = (path: string, url: string) => {
  const keys: Key[] = [];
  const regexp = pathToRegexp(path, keys);
  const match = regexp.exec(url);

  if (!match) return false;

  const [uri, ...values] = match;
  const isExact = path === uri;

  return {
    path,
    isExact,
    values,
    url: path === "/" && uri === "" ? "/" : uri,
  };
};

export const extractRegion = (url: RequestInfo): PlatformId | null => {
  const uri = new URL(url as string);
  const didMatch = matchPath(HOST, uri.host);
  if (didMatch) return didMatch.values[0] as PlatformId;
  return null;
};

export const extractMethod = (url: RequestInfo): string | null => {
  const path = new URL(url as string).pathname;
  let method: string | null = null;

  (Object.keys(METHODS) as Array<keyof METHODS>).map((service) => {
    Object.entries(METHODS[service]).some(([m, p]: [string, string]) => {
      if (matchPath(p, path)) {
        method = `${service}.${m}`;
        return true;
      }
    });
  });

  return method;
};
