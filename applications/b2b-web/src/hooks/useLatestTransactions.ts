import { TransactionListResponseSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

export const useLatestTransactions = (token: string, companyId: string | undefined) =>
  useQuery({
    queryKey: ['transactions', token, companyId, { limit: 3 }],
    queryFn: () =>
      apiGet(`/v1/companies/${companyId}/transactions?limit=3`, TransactionListResponseSchema, token),
    enabled: Boolean(companyId),
  });
