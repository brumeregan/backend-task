import { AuditLog } from '../models';
import type { Transaction } from 'sequelize';

export type AuditEntry = {
  action: 'card.activated' | 'card.frozen' | 'card.unfrozen' | 'limit.changed';
  companyId: string;
  targetType: 'card';
  targetId: string;
  // IDs, amounts and statuses only. Never personal data.
  metadata: Record<string, unknown>;
};

// Always written in the same DB transaction as the change it records.
export const insertAuditLog = (
  userId: string,
  entry: AuditEntry,
  transaction: Transaction,
) => AuditLog.create({ actorId: userId, ...entry }, { transaction });
