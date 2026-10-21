import { IsoDateTimeSchema, listOf, UuidSchema } from './common';
import { z } from 'zod';

export const CardStatusSchema = z.enum(['inactive', 'active', 'frozen', 'blocked', 'expired']);

export const CardSchema = z.object({
  id: UuidSchema,
  companyId: UuidSchema,
  accountId: UuidSchema,
  cardholder: z.object({
    id: UuidSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
  last4: z.string().regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int(),
  status: CardStatusSchema,
  activatedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});

export const CardIdParamsSchema = z.object({
  cardId: UuidSchema,
});

export const CardListResponseSchema = listOf(CardSchema);

export type CardStatus = z.infer<typeof CardStatusSchema>;
export type Card = z.infer<typeof CardSchema>;
export type CardIdParams = z.infer<typeof CardIdParamsSchema>;
export type CardListResponse = z.infer<typeof CardListResponseSchema>;
