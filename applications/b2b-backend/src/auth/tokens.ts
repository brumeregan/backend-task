import jwt from "jsonwebtoken";

// Mocked identity provider. In production the token would come from BankID/Freja/other identity provider
// via an OIDC provider; the API would only verify it, exactly like verifyAccessToken.
export type AccessTokenClaims = { sub: string };

export type TokensConfig = { jwtSecret: string; jwtIssuer: string };

export const createTokens = ({ jwtSecret, jwtIssuer }: TokensConfig) => ({
  signAccessToken: (
    userId: string,
    expiresIn: jwt.SignOptions["expiresIn"] = "30d",
  ) =>
    jwt.sign({}, jwtSecret, {
      algorithm: "HS256",
      subject: userId,
      issuer: jwtIssuer,
      expiresIn,
    }),

  verifyAccessToken: (token: string): AccessTokenClaims => {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: jwtIssuer,
    });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new Error("Token has no subject");
    }
    return { sub: payload.sub };
  },
});

export type Tokens = ReturnType<typeof createTokens>;
