import { InvoiceListResponseSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

// The badge only needs the next invoice due: the list is sorted by due date, so ask for one.
export const useOpenInvoices = (token: string, companyId: string | undefined) =>
  useQuery({
    queryKey: ['invoices', token, companyId, 'open', { limit: 1 }],
    queryFn: () =>
      apiGet(`/v1/companies/${companyId}/invoices?status=open&limit=1`, InvoiceListResponseSchema, token),
    enabled: Boolean(companyId),
  });
