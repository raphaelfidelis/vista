import { getAccounts, getBanks } from '@/lib/finance.api';
import { currentDate } from '@/lib/month';
import { AccountsView } from './AccountsView';

export default async function AccountsPage() {
  const [accounts, banks] = await Promise.all([getAccounts(), getBanks()]);

  return (
    <AccountsView
      accounts={accounts}
      banks={banks}
      defaultDate={currentDate()}
    />
  );
}
