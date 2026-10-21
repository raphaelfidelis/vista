import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/lib/finance';

const STYLES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-panel text-secondary',
  CLOSED: 'bg-panel text-primary',
  PAID: 'bg-panel text-accent',
  OVERDUE: 'bg-accent text-on-accent',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] ${STYLES[status]}`}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
