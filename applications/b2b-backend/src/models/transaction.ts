import { DataTypes, Model } from "sequelize";
import { TransactionStatusSchema } from "@qred/b2b-app-schemas";
import type { TransactionStatus } from "@qred/b2b-app-schemas";
import type { Card } from "./card";
import type { Invoice } from "./invoice";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

// One row per purchase, updated as it moves through its lifecycle.
export class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<string>;
  declare cardId: string;
  declare status: TransactionStatus;
  // Minor units in the account currency.
  declare amount: number;
  declare currency: string;
  // Set when the purchase was made in another currency (EUR, USD...).
  declare originalAmount: CreationOptional<number | null>;
  declare originalCurrency: CreationOptional<string | null>;
  declare merchantName: CreationOptional<string | null>;
  declare merchantCategoryCode: CreationOptional<string | null>;
  declare merchantCountry: CreationOptional<string | null>;
  declare declineReason: CreationOptional<string | null>;
  declare authorizedAt: Date;
  declare clearedAt: CreationOptional<Date | null>;
  // Set when the transaction is billed on an invoice.
  declare invoiceId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare card?: NonAttribute<Card>;
  declare invoice?: NonAttribute<Invoice>;
}

export const initTransaction = (sequelize: Sequelize) => {
  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cardId: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [[...TransactionStatusSchema.options]] },
      },
      amount: { type: DataTypes.BIGINT, allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      originalAmount: { type: DataTypes.BIGINT, allowNull: true },
      originalCurrency: { type: DataTypes.STRING(3), allowNull: true },
      merchantName: { type: DataTypes.STRING, allowNull: true },
      merchantCategoryCode: { type: DataTypes.STRING(4), allowNull: true },
      merchantCountry: { type: DataTypes.STRING(2), allowNull: true },
      declineReason: { type: DataTypes.STRING, allowNull: true },
      authorizedAt: { type: DataTypes.DATE, allowNull: false },
      clearedAt: { type: DataTypes.DATE, allowNull: true },
      invoiceId: { type: DataTypes.UUID, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
    },
  );
};
