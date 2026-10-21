import { CardSchema } from '@qred/b2b-app-schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/apiClient';
import { spendLimitKey } from './useSpendLimit';

export const useCardMutations = (token: string, companyId: string, cardId: string) => {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cards', token, companyId] }),
      queryClient.invalidateQueries({ queryKey: ['card', token, cardId] }),
      queryClient.invalidateQueries({ queryKey: spendLimitKey(token, cardId) }),
    ]);
  };

  const activate = useMutation({
    mutationFn: () => apiPost(`/v1/cards/${cardId}/activate`, CardSchema, token),
    onSuccess: refresh,
  });
  const freeze = useMutation({
    mutationFn: () => apiPost(`/v1/cards/${cardId}/freeze`, CardSchema, token),
    onSuccess: refresh,
  });
  const unfreeze = useMutation({
    mutationFn: () => apiPost(`/v1/cards/${cardId}/unfreeze`, CardSchema, token),
    onSuccess: refresh,
  });

  return { activate, freeze, unfreeze };
};
