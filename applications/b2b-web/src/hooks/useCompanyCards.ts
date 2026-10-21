import { CardListResponseSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

export const useCompanyCards = (token: string, companyId: string | undefined) =>
  useQuery({
    queryKey: ['cards', token, companyId],
    queryFn: () => apiGet(`/v1/companies/${companyId}/cards`, CardListResponseSchema, token),
    enabled: Boolean(companyId),
  });
