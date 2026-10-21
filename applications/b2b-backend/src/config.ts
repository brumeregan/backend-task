import { ZodError } from "zod";
import { databaseConfig, DatabaseConfig } from "./resources/database";
import { createLogger, loggerConfig, LoggerConfig } from "./resources/logger";
import { httpAppConfig, HttpAppConfig } from "./app";

export const DEV_JWT_SECRET = "dev-only-secret-change-me";

export type RuntimeConfig = {
  logger: LoggerConfig;
  database: DatabaseConfig;
  http: HttpAppConfig;
};

export const getConfig = () => {
  try {
    const config = {
      logger: loggerConfig.parse({
        level: process.env.LOG_LEVEL,
        pretty: enabled(process.env.PRETTY_LOG),
      }),
      database: databaseConfig.parse({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        name: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD, // Shouldn't be set from env in production. Signed time-limited token should be used instead.
      }),
      http: httpAppConfig.parse({
        auth: { jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_SECRET },
        port: process.env.PORT ? Number(process.env.PORT) : undefined,
        cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:3001" },
      }),
    };
    if (
      process.env.NODE_ENV === "production" &&
      config.http.auth.jwtSecret === DEV_JWT_SECRET
    ) {
      throw new Error("JWT_SECRET must be set in production");
    }
    return config;
  } catch (error) {
    const errorLogger = createLogger({ level: "error" });
    let message;
    if (error instanceof ZodError) {
      const errorPaths = error.issues.map((i) => i.path.join(".")).join(", ");
      message = `Environment variables validation failed for paths: ${errorPaths}`;
    } else {
      message = `Invalid configuration: ${error}`;
    }
    errorLogger.error(message);
    process.exit(1);
  }
};

const enabled = (value: string | undefined) => value?.toLowerCase() === "true";
