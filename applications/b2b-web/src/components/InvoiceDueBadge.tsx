import { useOpenInvoices } from '../hooks/useOpenInvoices';
import { Chevron } from './Chevron';

type Props = { token: string; companyId: string | undefined };

// The "Invoice due ›" tab on top of the card. It has its own request, so a failing
// invoices call only hides the badge and never blocks the card.
export const InvoiceDueBadge = ({ token, companyId }: Props) => {
  const query = useOpenInvoices(token, companyId);
  if (query.isPending) {
    return (
      <span className="invoice-badge muted" role="status">
        Invoice due…
      </span>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="invoice-badge error" onClick={() => void query.refetch()}>
        Invoices unavailable · Retry
      </button>
    );
  }
  // Sorted by due date ascending, so the first open invoice is the next one due.
  const invoice = query.data.data[0];
  if (!invoice) {
    return null;
  }
  return (
    <span className="invoice-badge" title={`Due ${invoice.dueDate} · reference ${invoice.reference}`}>
      Invoice due <strong>{invoice.outstanding.formattedAmount}</strong>
      <Chevron />
    </span>
  );
};
