import { DataTypes, Model } from "sequelize";
import { CardStatusSchema } from "@qred/b2b-app-schemas";
import type { CardStatus } from "@qred/b2b-app-schemas";
import type { Account } from "./account";
import type { SpendLimit } from "./spend-limit";
import type { Transaction } from "./transaction";
import type { User } from "./user";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

export class Card extends Model<
  InferAttributes<Card>,
  InferCreationAttributes<Card>
> {
  declare id: CreationOptional<string>;
  declare accountId: string;
  declare cardholderUserId: string;
  // Reference at the card issuer; the only identifier we would ever send to them.
  declare issuerCardId: string;
  declare last4: string;
  declare expiryMonth: number;
  declare expiryYear: number;
  declare status: CreationOptional<CardStatus>;
  declare activatedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare account?: NonAttribute<Account>;
  declare cardholder?: NonAttribute<User>;
  declare transactions?: NonAttribute<Transaction[]>;
  declare spendLimits?: NonAttribute<SpendLimit[]>;
}

export const initCard = (sequelize: Sequelize) => {
  Card.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accountId: { type: DataTypes.UUID, allowNull: false },
      cardholderUserId: { type: DataTypes.UUID, allowNull: false },
      issuerCardId: { type: DataTypes.STRING, allowNull: false, unique: true },
      last4: {
        type: DataTypes.STRING(4),
        allowNull: false,
        validate: { is: /^\d{4}$/ },
      },
      expiryMonth: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 1, max: 12 },
      },
      expiryYear: { type: DataTypes.SMALLINT, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "inactive",
        validate: { isIn: [[...CardStatusSchema.options]] },
      },
      activatedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Card",
      tableName: "cards",
    },
  );
};
