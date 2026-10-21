import { SequelizeStorage, Umzug } from 'umzug';
import * as init from './migrations/0001-init';
import type { QueryInterface, Sequelize } from 'sequelize';

// Migrations are imported statically (no glob) so they survive tsup bundling.
// Add new migrations to this list, in order.
export const createMigrator = (sequelize: Sequelize) =>
  new Umzug<QueryInterface>({
    migrations: [
      {
        name: '0001-init',
        up: async ({ context }) => init.up({ context }),
        down: async ({ context }) => init.down({ context }),
      },
    ],
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  });
