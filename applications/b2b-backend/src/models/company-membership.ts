import { DataTypes, Model } from "sequelize";
import type { Company } from "./company";
import type { User } from "./user";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";

// Who can access which company. Roles are out of scope for now.
export class CompanyMembership extends Model<
  InferAttributes<CompanyMembership>,
  InferCreationAttributes<CompanyMembership>
> {
  declare userId: string;
  declare companyId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare company?: NonAttribute<Company>;
}

export const initCompanyMembership = (sequelize: Sequelize) => {
  CompanyMembership.init(
    {
      userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      companyId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "CompanyMembership",
      tableName: "company_memberships",
    },
  );
};
