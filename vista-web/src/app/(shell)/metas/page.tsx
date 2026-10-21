import { getAccounts, getGoals } from '@/lib/finance.api';
import { GoalsView } from './GoalsView';

export default async function GoalsPage() {
  const [goals, accounts] = await Promise.all([getGoals(), getAccounts()]);

  return <GoalsView goals={goals} accounts={accounts} />;
}
