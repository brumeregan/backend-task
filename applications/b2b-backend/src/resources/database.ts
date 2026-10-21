import { z } from "zod";
import { ConnectionError, Sequelize } from "sequelize";
import * as pg from "pg";
import { Logger } from "./logger";

export const databaseConfig = z.object({
  host: z.string(),
  name: z.string(),
  password: z.string(),
  port: z.number(),
  username: z.string(),
});

export type DatabaseConfig = z.infer<typeof databaseConfig>;

export const createDatabase = (config: DatabaseConfig, logger: Logger) => {
  const { name, username, password, host, port } = config;

  return new Sequelize(name, username, password, {
    host,
    dialect: "postgres",
    port,
    dialectModule: pg,
    define: {
      underscored: true, // camelCase attributes map to snake_case columns
      timestamps: true, // created_at/updated_at on every model unless it opts out (audit_log)
    },
    pool: {
      max: 34, // Could be increased or decreased based on the DB config (CPU, RAM) and amount of running copies of this application (e.g. 3 copies * 34 = 102 max connections)
    },
    retry: {
      max: 3,
      match: [ConnectionError],
    },
    logging: (msg) => logger.debug(msg), // Debug logger (set LOG_LEVEL to 'debug')
  });
};
