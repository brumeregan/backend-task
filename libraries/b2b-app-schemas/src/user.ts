import { listOf, UuidSchema } from './common';
import { z } from 'zod';

// The signed-in user's own profile (GET /v1/user). tax_number is never returned.
export const UserSchema = z.object({
  id: UuidSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
});

export const CompanyStatusSchema = z.enum(['pending', 'active', 'suspended', 'closed']);

export const CompanySummarySchema = z.object({
  id: UuidSchema,
  orgNumber: z.string(),
  legalName: z.string(),
  status: CompanyStatusSchema,
});

// Companies the signed-in user is a member of (GET /v1/user/companies).
export const UserCompaniesResponseSchema = listOf(CompanySummarySchema);

export type User = z.infer<typeof UserSchema>;
export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;
export type CompanySummary = z.infer<typeof CompanySummarySchema>;
export type UserCompaniesResponse = z.infer<typeof UserCompaniesResponseSchema>;
