import { Sequelize } from "sequelize";
import { createDatabase } from "./database";
import { createLogger, Logger } from "./logger";
import { RuntimeConfig } from "../config";

export type Resources = {
  logger: Logger;
  database: Sequelize;
};

export const createResources = (config: RuntimeConfig) => {
  const logger = createLogger(config.logger);

  const database = createDatabase(config.database, logger);

  return {
    logger,
    database,
  };
};

export const startResources = async ({ database }: Resources) => {
  // NOTE: Use Promise.all() when more resources added
  await database.authenticate();

  return async () => await database.close();
};
