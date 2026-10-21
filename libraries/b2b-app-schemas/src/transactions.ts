import { IsoDateTimeSchema, MoneySchema, PageQuerySchema, paginated, UuidSchema } from './common';
import { z } from 'zod';

export const TransactionStatusSchema = z.enum([
  'pending',
  'cleared',
  'declined',
  'reversed',
  'refunded',
]);

export const TransactionSchema = z.object({
  id: UuidSchema,
  cardId: UuidSchema,
  status: TransactionStatusSchema,
  // In the account currency.
  amount: MoneySchema,
  // Set when the purchase was made in another currency.
  originalAmount: MoneySchema.nullable(),
  merchant: z.object({
    name: z.string().nullable(),
    categoryCode: z.string().nullable(),
    country: z.string().nullable(),
  }),
  declineReason: z.string().nullable(),
  authorizedAt: IsoDateTimeSchema,
  clearedAt: IsoDateTimeSchema.nullable(),
  invoiceId: UuidSchema.nullable(),
});

export const TransactionIdParamsSchema = z.object({
  transactionId: UuidSchema,
});

// Newest first (authorizedAt, then id as tie-breaker, so pages are stable).
export const TransactionListQuerySchema = PageQuerySchema.extend({
  cardId: UuidSchema.optional(),
  status: TransactionStatusSchema.optional(),
});

export const TransactionListResponseSchema = paginated(TransactionSchema);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionIdParams = z.infer<typeof TransactionIdParamsSchema>;
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
export type TransactionListQueryInput = z.input<typeof TransactionListQuerySchema>;
export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;
