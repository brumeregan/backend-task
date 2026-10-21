import { DataTypes, Model } from "sequelize";
import { CompanyStatusSchema } from "@qred/b2b-app-schemas";
import type { CompanyStatus } from "@qred/b2b-app-schemas";
import type { Account } from "./account";
import type { CompanyMembership } from "./company-membership";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

// Legal entity (Company AB).
export class Company extends Model<
  InferAttributes<Company>,
  InferCreationAttributes<Company>
> {
  declare id: CreationOptional<string>;
  declare orgNumber: string;
  declare legalName: string;
  declare status: CreationOptional<CompanyStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare memberships?: NonAttribute<CompanyMembership[]>;
  declare accounts?: NonAttribute<Account[]>;
}

export const initCompany = (sequelize: Sequelize) => {
  Company.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orgNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      legalName: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
        validate: { isIn: [[...CompanyStatusSchema.options]] },
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, modelName: "Company", tableName: "companies" },
  );
};
