import { DataTypes, Model, ValidationError } from "sequelize";
import { SpendLimitPeriodSchema } from "@qred/b2b-app-schemas";
import type { SpendLimitPeriod } from "@qred/b2b-app-schemas";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

// User-chosen cap below the credit limit. Applies to ONE card or to the whole account.
export class SpendLimit extends Model<
  InferAttributes<SpendLimit>,
  InferCreationAttributes<SpendLimit>
> {
  declare id: CreationOptional<string>;
  declare cardId: CreationOptional<string | null>;
  declare accountId: CreationOptional<string | null>;
  declare amount: number;
  declare period: SpendLimitPeriod;
  declare createdBy: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const initSpendLimit = (sequelize: Sequelize) => {
  SpendLimit.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cardId: { type: DataTypes.UUID, allowNull: true },
      accountId: { type: DataTypes.UUID, allowNull: true },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: { min: 1 },
      },
      period: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [[...SpendLimitPeriodSchema.options]] },
      },
      createdBy: { type: DataTypes.UUID, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, modelName: "SpendLimit", tableName: "spend_limits" },
  );

  // XOR rule (also a CHECK constraint in the migration). Done in a hook because
  // model-level validators are `function`s that rely on `this`.
  SpendLimit.addHook(
    "beforeValidate",
    "exactlyOneTarget",
    (limit: SpendLimit) => {
      if ((limit.cardId == null) === (limit.accountId == null)) {
        throw new ValidationError(
          "A spend limit must target exactly one of cardId or accountId",
          [],
        );
      }
    },
  );
};
