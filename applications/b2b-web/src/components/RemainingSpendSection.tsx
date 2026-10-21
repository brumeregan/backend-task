import { useSpendLimit } from '../hooks/useSpendLimit';
import { errorMessage } from '../lib/apiClient';
import { Chevron } from './Chevron';
import { SectionState } from './SectionState';

type Props = { token: string; cardId: string | undefined; cardsLoading: boolean };

// "Remaining spend  5 400 / 10 000 kr  based on your set limit". All amounts are
// formatted by the server; the UI only computes a ratio for the progress bar.
export const RemainingSpendSection = ({ token, cardId, cardsLoading }: Props) => {
  const query = useSpendLimit(token, cardId);
  const spend = query.data;
  const ratio =
    spend && spend.limit.amount > 0 ? Math.min(1, Math.max(0, spend.used.amount / spend.limit.amount)) : 0;
  const basedOn =
    spend?.source === 'card'
      ? 'based on your set limit'
      : spend?.source === 'account'
        ? 'based on the company limit'
        : 'based on your credit limit';
  return (
    <SectionState
      title="Remaining spend"
      isLoading={cardsLoading || (Boolean(cardId) && query.isPending)}
      error={query.isError ? errorMessage(query.error) : null}
      isEmpty={!cardId || !spend}
      emptyText="No card selected."
      onRetry={() => void query.refetch()}
    >
      {spend ? (
        <div>
          <div className="spend-row">
            <p className="spend-total">
              <strong>{spend.remaining.formattedAmount}</strong>
              <span className="muted"> / {spend.limit.formattedAmount}</span>
            </p>
            <Chevron />
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Spent of limit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
          >
            <div className="progress-fill" style={{ width: `${ratio * 100}%` }} />
          </div>
          <div className="spend-footer">
            <span className="muted">Spent {spend.used.formattedAmount}</span>
            <span className="muted">{basedOn}</span>
          </div>
        </div>
      ) : null}
    </SectionState>
  );
};
