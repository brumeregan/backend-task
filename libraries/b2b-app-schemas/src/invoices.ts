import { IsoDateSchema, MoneySchema, PageQuerySchema, paginated, UuidSchema } from './common';
import { z } from 'zod';

export const InvoiceStatusSchema = z.enum(['draft', 'open', 'paid', 'overdue', 'cancelled']);

export const InvoiceSchema = z.object({
  id: UuidSchema,
  accountId: UuidSchema,
  periodStart: IsoDateSchema,
  periodEnd: IsoDateSchema,
  dueDate: IsoDateSchema,
  total: MoneySchema,
  paid: MoneySchema,
  // total - paid
  outstanding: MoneySchema,
  // Payment reference (OCR).
  reference: z.string(),
  status: InvoiceStatusSchema,
});

export const InvoiceIdParamsSchema = z.object({
  invoiceId: UuidSchema,
});

// Invoices are sorted by dueDate ascending (id as tie-breaker, so pages are stable). The
// "Invoice due" badge asks for `?status=open&limit=1`: the first item is the next invoice due,
// and `page.totalCount` says how many open invoices there are.
export const InvoiceListQuerySchema = PageQuerySchema.extend({
  status: InvoiceStatusSchema.optional(),
});

export const InvoiceListResponseSchema = paginated(InvoiceSchema);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceIdParams = z.infer<typeof InvoiceIdParamsSchema>;
export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;
export type InvoiceListQueryInput = z.input<typeof InvoiceListQuerySchema>;
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
