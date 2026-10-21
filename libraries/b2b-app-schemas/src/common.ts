import { z } from 'zod';

export const UuidSchema = z.string().uuid();

export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 currency code');

export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const IsoDateSchema = z.string().date();

// All amounts are integers in minor units (öre, cent). `formattedAmount` is a
// human readable string built by the server ("12.03 SEK"), so clients never do money math.
export const MoneySchema = z.object({
  amount: z.number().int(),
  currency: CurrencySchema,
  formattedAmount: z.string(),
});

// Page-number pagination (`?page=2&limit=20`), the same for every paginated list.
export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PageInfoSchema = z.object({
  number: z.number().int().min(1),
  limit: z.number().int().min(1),
  // All items that match the request's filters (e.g. status), not just this page and not
  // the unfiltered total. Drives "54 more items".
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasMore: z.boolean(),
});

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), page: PageInfoSchema });

// Envelope for small, non-paginated lists. Same `data` key as paginated lists,
// so pagination can be added later without a breaking change.
export const listOf = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) });

// RFC 7807 error body, returned with `application/problem+json`.
export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  requestId: z.string().optional(),
  // Validation errors (400 only).
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export const CompanyIdParamsSchema = z.object({
  companyId: UuidSchema,
});

export type Money = z.infer<typeof MoneySchema>;
export type PageQuery = z.infer<typeof PageQuerySchema>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type CompanyIdParams = z.infer<typeof CompanyIdParamsSchema>;
