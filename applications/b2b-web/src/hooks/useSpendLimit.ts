import { SpendLimitSchema } from '@qred/b2b-app-schemas';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';

export const spendLimitKey = (token: string, cardId: string | undefined) =>
  ['spend-limit', token, cardId] as const;

export const useSpendLimit = (token: string, cardId: string | undefined) =>
  useQuery({
    queryKey: spendLimitKey(token, cardId),
    queryFn: () => apiGet(`/v1/cards/${cardId}/spend-limit`, SpendLimitSchema, token),
    enabled: Boolean(cardId),
  });
