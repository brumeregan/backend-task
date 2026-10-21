import type { Card } from '@qred/b2b-app-schemas';
import { useCardMutations } from '../hooks/useCardMutations';
import { errorMessage } from '../lib/apiClient';

type Props = { token: string; card: Card };

// The primary bottom button follows the card state machine:
// inactive -> "Activate card", active -> "Freeze card", frozen -> "Unfreeze card".
export const CardActionButton = ({ token, card }: Props) => {
  const { activate, freeze, unfreeze } = useCardMutations(token, card.companyId, card.id);
  const mutation = card.status === 'inactive' ? activate : card.status === 'active' ? freeze : unfreeze;

  const action =
    card.status === 'inactive' ? (
      <button type="button" className="primary block" disabled={activate.isPending} onClick={() => activate.mutate()}>
        {activate.isPending ? 'Activating…' : 'Activate card'}
      </button>
    ) : card.status === 'active' ? (
      <button type="button" className="primary block" disabled={freeze.isPending} onClick={() => freeze.mutate()}>
        {freeze.isPending ? 'Freezing…' : 'Freeze card'}
      </button>
    ) : card.status === 'frozen' ? (
      <button type="button" className="primary block" disabled={unfreeze.isPending} onClick={() => unfreeze.mutate()}>
        {unfreeze.isPending ? 'Unfreezing…' : 'Unfreeze card'}
      </button>
    ) : null;

  return (
    <div>
      {action}
      {mutation.isError ? (
        <p className="error" role="alert">
          {errorMessage(mutation.error)}
        </p>
      ) : null}
    </div>
  );
};
