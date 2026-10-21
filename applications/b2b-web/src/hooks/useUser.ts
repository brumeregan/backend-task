import { UserSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

export const useUser = (token: string) =>
  useQuery({
    queryKey: ['user', token],
    queryFn: () => apiGet('/v1/user', UserSchema, token),
  });
