import { z } from "zod";
import pino from "pino";
import type { DestinationStream, Logger } from "pino";

export type { Logger };

const logLevels = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

export const loggerConfig = z.object({
  level: logLevels.default("info").optional(),
  pretty: z.boolean().default(false).optional(),
});

export type LoggerConfig = z.infer<typeof loggerConfig>;

// Personal data and credentials never reach the logs. Bodies are not logged at all;
// this is the second line of defence for anything logged by accident.
export const redactConfig = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
    "authorization",
    "email",
    "phone",
    "firstName",
    "lastName",
    "taxNumber",
    "tax_number",
    "last4",
    "*.taxNumber",
    "*.tax_number",
    "*.email",
    "*.phone",
    "*.firstName",
    "*.lastName",
    "*.last4",
  ],
  censor: "[REDACTED]",
};

// HTTP access log keeps only what is needed to debug a request. Headers, client IP and
// user agent are dropped: under GDPR an IP address is personal data too.
export const httpSerializers = {
  req: (req: { id?: unknown; method?: string; url?: string }) => ({
    id: req.id,
    method: req.method,
    url: req.url,
  }),
  res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
};

export const createLogger = (
  config: LoggerConfig,
  destination?: DestinationStream,
) =>
  pino(
    {
      level: config.level ?? "info", // `.default().optional()` in the schema still lets undefined through
      redact: redactConfig,
      ...(config.pretty
        ? {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss" },
            },
          }
        : {}),
    },
    destination,
  );
