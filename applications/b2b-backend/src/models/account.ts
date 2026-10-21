import { DataTypes, Model } from "sequelize";
import type { Card } from "./card";
import type { Company } from "./company";
import type { Invoice } from "./invoice";
import type { SpendLimit } from "./spend-limit";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

// The credit agreement Qred grants the company.
export class Account extends Model<
  InferAttributes<Account>,
  InferCreationAttributes<Account>
> {
  declare id: CreationOptional<string>;
  declare companyId: string;
  // Minor units (öre). BIGINT can come back as a string from some drivers: map with Number().
  declare creditLimit: number;
  declare currency: CreationOptional<string>;
  declare billingDay: number;
  declare status: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare company?: NonAttribute<Company>;
  declare cards?: NonAttribute<Card[]>;
  declare invoices?: NonAttribute<Invoice[]>;
  declare spendLimits?: NonAttribute<SpendLimit[]>;
}

export const initAccount = (sequelize: Sequelize) => {
  Account.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: { type: DataTypes.UUID, allowNull: false },
      creditLimit: { type: DataTypes.BIGINT, allowNull: false },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "SEK",
      },
      // Capped at 28 so the billing day exists in every month.
      billingDay: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 1, max: 28 },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, modelName: "Account", tableName: "accounts" },
  );
};
