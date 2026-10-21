import { IsoDateSchema, MoneySchema, UuidSchema } from './common';
import { z } from 'zod';

export const SpendLimitPeriodSchema = z.enum(['monthly', 'total']);

// Where the effective limit comes from:
// - card:    a limit set on this card
// - account: an account-wide limit
// - credit:  no user limit, so the account's credit limit applies
export const SpendLimitSourceSchema = z.enum(['card', 'account', 'credit']);

// "Remaining spend ... based on your set limit".
export const SpendLimitSchema = z.object({
  cardId: UuidSchema,
  source: SpendLimitSourceSchema,
  period: SpendLimitPeriodSchema,
  // null for period = total
  periodStart: IsoDateSchema.nullable(),
  periodEnd: IsoDateSchema.nullable(),
  limit: MoneySchema,
  used: MoneySchema,
  remaining: MoneySchema,
});

export const PutSpendLimitBodySchema = z.object({
  // Integer amount in minor units, in the account currency.
  amount: z.number().int().positive(),
  period: SpendLimitPeriodSchema,
});

export type SpendLimitPeriod = z.infer<typeof SpendLimitPeriodSchema>;
export type SpendLimitSource = z.infer<typeof SpendLimitSourceSchema>;
export type SpendLimit = z.infer<typeof SpendLimitSchema>;
export type PutSpendLimitBody = z.infer<typeof PutSpendLimitBodySchema>;
