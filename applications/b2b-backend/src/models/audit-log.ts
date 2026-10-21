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

// Who did what. Append-only: rows are never updated, hence no updated_at.
export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  // BIGINT: pg returns it as a string, so it is not a JS number.
  declare id: CreationOptional<string>;
  declare actorId: CreationOptional<string | null>;
  declare companyId: CreationOptional<string | null>;
  // e.g. 'card.frozen', 'limit.changed'
  declare action: string;
  declare targetType: CreationOptional<string | null>;
  declare targetId: CreationOptional<string | null>;
  declare metadata: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;

  declare actor?: NonAttribute<User>;
  declare company?: NonAttribute<Company>;
}

export const initAuditLog = (sequelize: Sequelize) => {
  AuditLog.init(
    {
      // bigserial: the log is append-only and never pruned.
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      actorId: { type: DataTypes.UUID, allowNull: true },
      companyId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false },
      targetType: { type: DataTypes.STRING, allowNull: true },
      targetId: { type: DataTypes.UUID, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "AuditLog",
      tableName: "audit_log",
      updatedAt: false, // append-only
    },
  );
};
