import { UserCompaniesResponseSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

export const useUserCompanies = (token: string) =>
  useQuery({
    queryKey: ['user-companies', token],
    queryFn: () => apiGet('/v1/user/companies', UserCompaniesResponseSchema, token),
  });
