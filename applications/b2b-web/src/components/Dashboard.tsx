'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCompanyCards } from '../hooks/useCompanyCards';
import { useUser } from '../hooks/useUser';
import { useUserCompanies } from '../hooks/useUserCompanies';
import { errorMessage } from '../lib/apiClient';
import { devUsers } from '../lib/devUsers';
import { AppHeader } from './AppHeader';
import { CardActionButton } from './CardActionButton';
import { CardImage } from './CardImage';
import { CompanySwitcher } from './CompanySwitcher';
import { InvoiceDueBadge } from './InvoiceDueBadge';
import { LatestTransactionsSection } from './LatestTransactionsSection';
import { RemainingSpendSection } from './RemainingSpendSection';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { UserSwitcher } from './UserSwitcher';

// Layout follows Appendix 1. Every block has its own request and error boundary:
//   /user/companies -> companyId -> cards | open invoices | transactions (parallel)
//   cards + /user   -> the user's own card -> spend limit, card action
export const Dashboard = () => {
  const queryClient = useQueryClient();
  const [userIndex, setUserIndex] = useState(0);
  const [pickedCompanyId, setPickedCompanyId] = useState<string | undefined>();
  const token = devUsers[userIndex]?.token ?? 'dev-token';

  const user = useUser(token);
  const companies = useUserCompanies(token);
  const companyList = companies.data?.data ?? [];
  // Default to the first company; an explicit pick wins while it is still valid.
  const companyId = companyList.find((c) => c.id === pickedCompanyId)?.id ?? companyList[0]?.id;

  const cards = useCompanyCards(token, companyId);
  const cardList = cards.data?.data ?? [];
  // Show the signed-in user's own card; fall back to the first card of the company.
  const card =
    user.isPending && !user.isError
      ? undefined
      : (cardList.find((c) => c.cardholder.id === user.data?.id) ?? cardList[0]);
  const cardsLoading = (cards.isPending && cards.fetchStatus !== 'idle') || user.isPending;

  const switchUser = (index: number) => {
    // Demo stand-in for sign-out/sign-in: drop all cached data of the previous user.
    queryClient.clear();
    setPickedCompanyId(undefined);
    setUserIndex(index);
  };

  return (
    <main className="page">
      <UserSwitcher value={userIndex} onChange={switchUser} />
      <div className="phone">
        <AppHeader />

        {companies.isPending ? (
          <div className="company-bar muted" role="status">
            Loading companies…
          </div>
        ) : companies.isError ? (
          <div className="company-bar error" role="alert">
            {errorMessage(companies.error)}{' '}
            <button type="button" onClick={() => void companies.refetch()}>
              Retry
            </button>
          </div>
        ) : companyList.length === 0 ? (
          <div className="company-bar muted">You are not a member of any company.</div>
        ) : (
          <CompanySwitcher companies={companyList} value={companyId} onChange={setPickedCompanyId} />
        )}

        <SectionErrorBoundary key={`card-${token}-${companyId}`} title="Your card">
          <CardImage
            query={cards}
            card={card}
            badge={
              <SectionErrorBoundary key={`invoice-${token}-${companyId}`} title="Invoice due" fallback={null}>
                <InvoiceDueBadge token={token} companyId={companyId} />
              </SectionErrorBoundary>
            }
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary key={`spend-${token}-${card?.id}`} title="Remaining spend">
          <RemainingSpendSection token={token} cardId={card?.id} cardsLoading={cardsLoading} />
        </SectionErrorBoundary>

        <SectionErrorBoundary key={`tx-${token}-${companyId}`} title="Latest transactions">
          <LatestTransactionsSection token={token} companyId={companyId} />
        </SectionErrorBoundary>

        <div className="bottom-actions">
          {card ? (
            <SectionErrorBoundary key={`action-${token}-${card.id}`} title="Card action" fallback={null}>
              <CardActionButton key={card.id} token={token} card={card} />
            </SectionErrorBoundary>
          ) : null}
          <button type="button" className="primary block">
            Contact Qred&apos;s support
          </button>
        </div>
      </div>
    </main>
  );
};
