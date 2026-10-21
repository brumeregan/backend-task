import type { ReactNode } from 'react';

type Props = {
  title: string;
  isLoading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
};

// Shared shell for a page section: heading plus loading / error / empty / content states.
export const SectionState = ({ title, isLoading, error, isEmpty, emptyText, onRetry, children }: Props) => (
  <section className="section" aria-label={title} aria-busy={isLoading}>
    <h2>{title}</h2>
    {isLoading ? (
      <p className="muted" role="status">
        Loading...
      </p>
    ) : error ? (
      <div className="error" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    ) : isEmpty ? (
      <p className="muted">{emptyText ?? 'Nothing to show.'}</p>
    ) : (
      children
    )}
  </section>
);
