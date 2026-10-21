import GracefulShutdown from "http-graceful-shutdown";
import { z } from "zod";
import cors from "cors";
import express, { type Express, type Request } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { httpSerializers } from "./resources/logger";
import { createTokens } from "./auth/tokens";
import { authenticate } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createRateLimiter } from "./middleware/rateLimit";
import { requestContext } from "./middleware/requestContext";
import { createV1Router } from "./handlers";
import { Resources } from "./resources";

export const httpAppConfig = z.object({
  auth: z.object({
    jwtSecret: z.string().min(16),
    jwtIssuer: z.string().default("qred-mock-auth"),
  }),
  port: z.number().default(3000),
  cors: z.object({
    origin: z.string(),
  }),
});

export type HttpAppConfig = z.infer<typeof httpAppConfig>;

export const createApp = (
  config: HttpAppConfig,
  resources: Resources,
): Express => {
  const { logger } = resources;

  const app = express();
  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => res.locals.requestId as string,
      serializers: httpSerializers,
      customProps: (req, res) => ({
        requestId: res.locals.requestId as string,
        userId: (req as Request).auth?.user.id,
      }),
      // Quiet health and readiness checks.
      autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/ready" },
    }),
  );

  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));
  app.use(createRateLimiter());
  app.use(express.json({ limit: "10kb" }));

  // Unauthenticated. Liveness: the process answers.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Readiness: the database answers too. Load balancers and compose route traffic on this.
  app.get("/ready", async (_req, res) => {
    try {
      await resources.database.authenticate();
      res.json({ status: "ok" });
    } catch (error) {
      logger.warn({ err: error }, "Readiness check failed");
      res.status(503).json({ status: "unavailable" });
    }
  });

  const { verifyAccessToken } = createTokens(config.auth);
  
  app.use("/v1", authenticate(verifyAccessToken), createV1Router(resources));

  app.use(notFoundHandler);
  app.use(errorHandler(resources));

  return app;
};

export const startHttpApp = (
  app: Express,
  { port }: HttpAppConfig,
  { logger }: Resources,
) => {
  const server = app.listen(port, () =>
    logger.info(`HTTP server is listening on port ${port}`),
  );

  return (cleanup: () => Promise<unknown>) =>
    GracefulShutdown(server, {
      signals: "SIGINT SIGTERM",
      timeout: 10000,
      development: false,
      forceExit: true,
      onShutdown: async () => {
        await cleanup();
      },
    });
};
