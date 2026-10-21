import type { UseQueryResult } from '@tanstack/react-query';
import type { Card, CardListResponse } from '@qred/b2b-app-schemas';
import { errorMessage } from '../lib/apiClient';
import { Chevron } from './Chevron';
import type { ReactNode } from 'react';

type Props = { query: UseQueryResult<CardListResponse>; card: Card | undefined; badge: ReactNode };

// Plain card visual with the invoice badge on top. Card details live behind the chevron
// (card detail view), so nothing about the card is printed here.
export const CardImage = ({ query, card, badge }: Props) => (
  <section className="card-block" aria-label="Your card">
    <div className="card-badge-slot">{badge}</div>
    <div className="card-image">
      {query.isPending && query.fetchStatus !== 'idle' ? (
        <span className="card-image-state" role="status">
          Loading card…
        </span>
      ) : query.isError ? (
        <span className="card-image-state" role="alert">
          {errorMessage(query.error)}{' '}
          <button type="button" onClick={() => void query.refetch()}>
            Retry
          </button>
        </span>
      ) : !card ? (
        <span className="card-image-state">No card yet</span>
      ) : (
        <span className="visually-hidden">Card</span>
      )}
      {card ? <Chevron /> : null}
    </div>
  </section>
);
