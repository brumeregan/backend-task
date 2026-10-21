import type { Sequelize } from "sequelize";
import { getConfig } from "./config";
import { createMigrator } from "./db/migrator";
import { seed } from "./db/seed";
import { initModels } from "./models";
import { createResources, startResources } from "./resources";
import type { Logger } from "./resources/logger";

// Database tasks for local runs and deploy pipelines. Commands run in the given order:
//   node dist/cli.js migrate seed
const USAGE = "Usage: cli <migrate | migrate:down | seed | reset>...";

type Command = (database: Sequelize, logger: Logger) => Promise<void>;

const migrate: Command = async (database, logger) => {
  const applied = await createMigrator(database).up();
  logger.info(`Applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(", ") || "none"}`);
};

const migrateDown: Command = async (database, logger) => {
  const reverted = await createMigrator(database).down();
  logger.info(`Reverted migration(s): ${reverted.map((m) => m.name).join(", ") || "none"}`);
};

const seedDatabase: Command = async (database, logger) => {
  const seeded = await seed(initModels(database));
  logger.info(seeded ? "Seeded the database" : "Database already seeded, skipping");
};

const reset: Command = async (database, logger) => {
  await createMigrator(database).down({ to: 0 });
  logger.info("Reverted all migrations");
  await migrate(database, logger);
  await seedDatabase(database, logger);
};

const commands: Record<string, Command> = {
  migrate,
  "migrate:down": migrateDown,
  seed: seedDatabase,
  reset,
};

const run = async (args: string[]) => {
  const unknown = args.filter((arg) => !commands[arg]);
  if (args.length === 0 || unknown.length > 0) {
    console.error(unknown.length > 0 ? `Unknown command(s): ${unknown.join(", ")}\n${USAGE}` : USAGE);
    process.exit(1);
  }

  const { logger, database } = createResources(getConfig());
  const release = await startResources({ logger, database });
  try {
    for (const arg of args) {
      logger.info(`Running "${arg}"`);
      await commands[arg]!(database, logger);
    }
  } finally {
    await release();
  }
};

run(process.argv.slice(2)).catch((error: unknown) => {
  console.error({ err: error }, "Database command failed");
  process.exit(1);
});
