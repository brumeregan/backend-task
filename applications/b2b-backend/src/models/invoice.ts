import { DataTypes, Model } from "sequelize";
import { InvoiceStatusSchema } from "@qred/b2b-app-schemas";
import type { InvoiceStatus } from "@qred/b2b-app-schemas";
import type { Account } from "./account";
import type { Transaction } from "./transaction";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

// Monthly invoice ("Invoice due").
export class Invoice extends Model<
  InferAttributes<Invoice>,
  InferCreationAttributes<Invoice>
> {
  declare id: CreationOptional<string>;
  declare accountId: string;
  // DATEONLY: plain 'YYYY-MM-DD' strings, no timezone surprises for billing periods.
  declare periodStart: string;
  declare periodEnd: string;
  declare total: number;
  declare paid: CreationOptional<number>;
  declare dueDate: string;
  // Payment reference (OCR).
  declare reference: string;
  declare status: CreationOptional<InvoiceStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare account?: NonAttribute<Account>;
  declare transactions?: NonAttribute<Transaction[]>;
}

export const initInvoice = (sequelize: Sequelize) => {
  Invoice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accountId: { type: DataTypes.UUID, allowNull: false },
      periodStart: { type: DataTypes.DATEONLY, allowNull: false },
      periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
      total: { type: DataTypes.BIGINT, allowNull: false },
      paid: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      dueDate: { type: DataTypes.DATEONLY, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "open",
        validate: { isIn: [[...InvoiceStatusSchema.options]] },
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Invoice",
      tableName: "invoices",
    },
  );
};
