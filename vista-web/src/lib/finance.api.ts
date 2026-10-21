import 'server-only';
import { requestApi } from '@/lib/api.server';
import type {
  Account,
  AccountChanges,
  AccountStatement,
  Bank,
  Card,
  CashFlow,
  CardChanges,
  CardInvoice,
  Category,
  CategoryKind,
  Goal,
  GoalChanges,
  Insights,
  MonthlyBudget,
  MonthlyReport,
  NewAccount,
  NewCard,
  NewGoal,
  NewRecurring,
  NewTransaction,
  Recurring,
  RecurringChanges,
  Transaction,
  TransactionChanges,
  TransactionSearch,
  TransactionSearchResult,
} from '@/lib/finance';
import { SEARCH_PAGE_SIZE } from '@/lib/finance';

// Bancos
export function getBanks(): Promise<Bank[]> {
  return requestApi('banks');
}

export function createBank(name: string): Promise<Bank> {
  return requestApi('banks', { method: 'POST', body: { name } });
}

export function renameBank(id: string, name: string): Promise<Bank> {
  return requestApi(`banks/${id}`, { method: 'PATCH', body: { name } });
}

export function deleteBank(id: string): Promise<void> {
  return requestApi(`banks/${id}`, { method: 'DELETE' });
}

// Categorias
export function getCategories(kind?: CategoryKind): Promise<Category[]> {
  return requestApi(kind ? `categories?kind=${kind}` : 'categories');
}

export function createCategory(
  name: string,
  kind: CategoryKind,
): Promise<Category> {
  return requestApi('categories', { method: 'POST', body: { name, kind } });
}

export function renameCategory(id: string, name: string): Promise<Category> {
  return requestApi(`categories/${id}`, { method: 'PATCH', body: { name } });
}

export function deleteCategory(id: string): Promise<void> {
  return requestApi(`categories/${id}`, { method: 'DELETE' });
}

// Contas
export function getAccounts(): Promise<Account[]> {
  return requestApi('accounts');
}

export function createAccount(input: NewAccount): Promise<Account> {
  return requestApi('accounts', { method: 'POST', body: input });
}

export function updateAccount(
  id: string,
  input: AccountChanges & { archived?: boolean },
): Promise<Account> {
  return requestApi(`accounts/${id}`, { method: 'PATCH', body: input });
}

export function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<Account> {
  return requestApi(`accounts/${id}`, { method: 'PATCH', body: { archived } });
}

export function deleteAccount(id: string): Promise<void> {
  return requestApi(`accounts/${id}`, { method: 'DELETE' });
}

export function adjustAccount(
  id: string,
  input: { balanceInCents: number; date: string },
): Promise<Account> {
  return requestApi(`accounts/${id}/adjust`, { method: 'POST', body: input });
}

export function getStatement(
  id: string,
  month: string,
): Promise<AccountStatement> {
  return requestApi(`accounts/${id}/statement?month=${month}`);
}

// Lançamentos e relatório
export function getReport(month: string): Promise<MonthlyReport> {
  return requestApi(`reports/monthly?month=${month}`);
}

export function createTransaction(input: NewTransaction): Promise<Transaction> {
  return requestApi('transactions', { method: 'POST', body: input });
}

export function updateTransaction(
  id: string,
  input: TransactionChanges,
): Promise<Transaction> {
  return requestApi(`transactions/${id}`, { method: 'PATCH', body: input });
}

export function searchTransactions(
  filters: TransactionSearch,
  offset: number,
): Promise<TransactionSearchResult> {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    offset: String(offset),
    limit: String(SEARCH_PAGE_SIZE),
  });

  for (const key of ['text', 'kind', 'categoryId', 'originId'] as const) {
    const value = filters[key];

    if (value) {
      params.set(key, value);
    }
  }

  return requestApi(`transactions/search?${params.toString()}`);
}

export function recategorizeTransactions(
  ids: string[],
  categoryId: string,
): Promise<{ updated: number }> {
  return requestApi('transactions/category', {
    method: 'PATCH',
    body: { ids, categoryId },
  });
}

export function deleteTransaction(id: string): Promise<void> {
  return requestApi(`transactions/${id}`, { method: 'DELETE' });
}

// Gastos fixos
export function getRecurring(): Promise<Recurring[]> {
  return requestApi('recurring');
}

export function createRecurring(input: NewRecurring): Promise<Recurring> {
  return requestApi('recurring', { method: 'POST', body: input });
}

export function updateRecurring(
  id: string,
  input: RecurringChanges,
): Promise<Recurring> {
  return requestApi(`recurring/${id}`, { method: 'PATCH', body: input });
}

export function deleteRecurring(id: string): Promise<void> {
  return requestApi(`recurring/${id}`, { method: 'DELETE' });
}

// Cartões
export function getCards(): Promise<Card[]> {
  return requestApi('cards');
}

export function createCard(input: NewCard): Promise<Card> {
  return requestApi('cards', { method: 'POST', body: input });
}

export function updateCard(id: string, input: CardChanges): Promise<Card> {
  return requestApi(`cards/${id}`, { method: 'PATCH', body: input });
}

export function setCardArchived(id: string, archived: boolean): Promise<Card> {
  return requestApi(`cards/${id}`, { method: 'PATCH', body: { archived } });
}

export function deleteCard(id: string): Promise<void> {
  return requestApi(`cards/${id}`, { method: 'DELETE' });
}

export function getInvoice(
  cardId: string,
  month: string,
): Promise<CardInvoice> {
  return requestApi(`cards/${cardId}/invoices/${month}`);
}

// Orçamento
export function getBudget(month: string): Promise<MonthlyBudget> {
  return requestApi(`budgets?month=${month}`);
}

export function setBudgetLimit(
  categoryId: string,
  amountInCents: number,
): Promise<void> {
  return requestApi(`budgets/${categoryId}`, {
    method: 'PUT',
    body: { amountInCents },
  });
}

export function removeBudgetLimit(categoryId: string): Promise<void> {
  return requestApi(`budgets/${categoryId}`, { method: 'DELETE' });
}

export function setBudgetOverride(
  categoryId: string,
  month: string,
  amountInCents: number,
): Promise<void> {
  return requestApi(`budgets/${categoryId}/months/${month}`, {
    method: 'PUT',
    body: { amountInCents },
  });
}

export function removeBudgetOverride(
  categoryId: string,
  month: string,
): Promise<void> {
  return requestApi(`budgets/${categoryId}/months/${month}`, {
    method: 'DELETE',
  });
}

// Metas
export function getGoals(): Promise<Goal[]> {
  return requestApi('goals');
}

export function createGoal(input: NewGoal): Promise<Goal> {
  return requestApi('goals', { method: 'POST', body: input });
}

export function updateGoal(id: string, input: GoalChanges): Promise<Goal> {
  return requestApi(`goals/${id}`, { method: 'PATCH', body: input });
}

export function deleteGoal(id: string): Promise<void> {
  return requestApi(`goals/${id}`, { method: 'DELETE' });
}

// Visão geral
export function getCashFlow(months: number): Promise<CashFlow> {
  return requestApi(`cash-flow?months=${months}`);
}

export function getInsights(month: string): Promise<Insights> {
  return requestApi(`insights?month=${month}`);
}
