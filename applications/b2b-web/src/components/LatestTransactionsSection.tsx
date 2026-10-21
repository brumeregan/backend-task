import { useLatestTransactions } from '../hooks/useLatestTransactions';
import { errorMessage } from '../lib/apiClient';
import { Chevron } from './Chevron';
import { SectionState } from './SectionState';

type Props = { token: string; companyId: string | undefined };

export const LatestTransactionsSection = ({ token, companyId }: Props) => {
  const query = useLatestTransactions(token, companyId);
  const transactions = query.data?.data ?? [];
  // page.totalCount comes from the API, so "N more" is exact without loading every page.
  const moreCount = query.data ? query.data.page.totalCount - transactions.length : 0;
  return (
    <SectionState
      title="Latest transactions"
      isLoading={query.isPending}
      error={query.isError ? errorMessage(query.error) : null}
      isEmpty={transactions.length === 0}
      emptyText="No transactions yet."
      onRetry={() => void query.refetch()}
    >
      <ul className="list">
        {transactions.map((tx) => (
          <li key={tx.id}>
            <div>
              <strong>{tx.merchant.name ?? 'Unknown merchant'}</strong>
              <div className="muted">{tx.authorizedAt.slice(0, 10)}</div>
            </div>
            <div className="right">
              <div>{tx.amount.formattedAmount}</div>
              <span className={`badge badge-${tx.status}`}>{tx.status}</span>
            </div>
          </li>
        ))}
      </ul>
      {moreCount > 0 ? (
        <button type="button" className="more-row">
          {moreCount} more {moreCount === 1 ? 'item' : 'items'} in transaction view
          <Chevron />
        </button>
      ) : null}
    </SectionState>
  );
};
