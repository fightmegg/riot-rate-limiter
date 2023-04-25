import nock from "nock";
import { FetchError } from "node-fetch";
import { request } from "../../src/request";

describe("request", () => {
  afterAll(() => {
    nock.restore();
  });

  const host = "https://fake.com";
  const path = "/something";

  test("it should THROW FetchError if timeout received", async () => {
    nock(host).get(path).delayConnection(2000).reply(200);
    await expect(
      request({ url: `${host}${path}`, options: { timeout: 200 } })
    ).rejects.toThrow(FetchError);
  });

  test("it should THROW if status 500 received", async () => {
    nock(host).get(path).reply(500);
    try {
      await request({ url: `${host}${path}` });
    } catch (e: any) {
      expect(e.status).toBe(500);
      expect(e.rateLimits).toBeInstanceOf(Object);
    }
  });

  test("it should THROW if status 400 received", async () => {
    nock(host).get(path).reply(400);
    try {
      await request({ url: `${host}${path}` });
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.rateLimits).toBeInstanceOf(Object);
    }
  });

  test("it should return JSON resp on 200", async () => {
    nock(host).get(path).reply(200, { summonerName: "Demos Kratos" });
    const resp = await request({ url: `${host}${path}` });
    expect(resp.json).toEqual({ summonerName: "Demos Kratos" });
    expect(resp.rateLimits).toBeInstanceOf(Object);
  });
});
