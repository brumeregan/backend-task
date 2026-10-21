import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTokens } from "../src/auth/tokens";
import { authenticate } from "../src/middleware/auth";
import { errorHandler } from "../src/middleware/errorHandler";
import { createLogger } from "../src/resources/logger";

const config = { jwtSecret: "test-secret-long-enough", jwtIssuer: "test-issuer" };
const tokens = createTokens(config);

const api = request(
  express()
    .use("/v1", authenticate(tokens.verifyAccessToken))
    .get("/v1/whoami", (req, res) => {
      res.json(req.auth);
    })
    .use(errorHandler({ logger: createLogger({ level: "silent" }) })),
);

describe("authenticate", () => {
  it("rejects a missing header", async () => {
    await api.get("/v1/whoami").expect(401);
  });

  it("rejects a malformed token", async () => {
    await api
      .get("/v1/whoami")
      .set("Authorization", "Bearer garbage")
      .expect(401);
  });

  it("rejects an expired token", async () => {
    const token = tokens.signAccessToken("user-1", "-1s");
    await api
      .get("/v1/whoami")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("rejects a token signed with another secret or issuer", async () => {
    for (const other of [
      { ...config, jwtSecret: "another-secret-long-enough" },
      { ...config, jwtIssuer: "someone-else" },
    ]) {
      const token = createTokens(other).signAccessToken("user-1");
      await api
        .get("/v1/whoami")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);
    }
  });

  it("exposes the token claims as req.auth", async () => {
    const token = tokens.signAccessToken("user-1");
    const res = await api
      .get("/v1/whoami")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ user: { id: "user-1" } });
  });
});
