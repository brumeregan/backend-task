import { unauthorized } from "../errors/httpError";
import type { Tokens } from "../auth/tokens";
import type { RequestHandler } from "express";

const BEARER = /^Bearer\s+(\S+)$/i;

// Requires a valid bearer token and exposes its claims as `req.auth`.
// The signature is trusted: no DB lookup, like with a real identity provider.
export const authenticate =
  (verifyAccessToken: Tokens["verifyAccessToken"]): RequestHandler =>
  (req, _res, next) => {
    const token = BEARER.exec(req.header("authorization") ?? "")?.[1];
    
    if (!token) {
      return next(unauthorized("Missing bearer token"));
    }

    try {
      const { sub } = verifyAccessToken(token);
      req.auth = { user: { id: sub } };

      return next();
    } catch {
      return next(unauthorized("Invalid or expired token"));
    }
  };
