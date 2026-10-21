export type CategoryKind = 'EXPENSE' | 'INCOME';

/** Banco: só nome. */
export type Bank = {
  id: string;
  name: string;
  createdAt: string;
};

export type Category = Bank & {
  kind: CategoryKind;
};

export type AccountType = 'CHECKING' | 'CASH' | 'RESERVE';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  bankId: string | null;
  bankName: string | null;
  initialBalanceInCents: number;
  /** AAAA-MM-DD */
  initialBalanceDate: string;
  archived: boolean;
  /** Saldo inicial + todos os movimentos da conta. */
  balanceInCents: number;
  createdAt: string;
};

export type TransactionKind = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  description: string;
  /** Positivo; no ajuste, com o sinal da correção. */
  amountInCents: number;
  /** AAAA-MM-DD */
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  /** Nulo na despesa no cartão. */
  accountId: string | null;
  accountName: string | null;
  /** Só na despesa no cartão. */
  cardId: string | null;
  cardName: string | null;
  toAccountId: string | null;
  toAccountName: string | null;
  /** Só no pagamento de fatura. */
  toCardId: string | null;
  toCardName: string | null;
  /** AAAA-MM (vencimento) da fatura da compra, ou da que o pagamento quita. */
  invoiceMonth: string | null;
  purchaseId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  /** Nulo para lançamento avulso (variável). */
  recurringId: string | null;
  createdAt: string;
};

export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Fração (0.25 = 25%); nulo quando o mês anterior foi zero. */
  change: number | null;
  /** Fração do total do mês; nulo quando o mês não teve movimento do tipo. */
  share: number | null;
};

export type MonthlyReport = {
  /** AAAA-MM */
  month: string;
  incomeInCents: number;
  expenseInCents: number;
  resultInCents: number;
  previousExpenseInCents: number;
  expenseDifferenceInCents: number;
  /** Fração; nulo quando o mês anterior foi zero. */
  expenseChange: number | null;
  fixedExpenseInCents: number;
  variableExpenseInCents: number;
  expenseCategories: CategoryBreakdown[];
  incomeCategories: CategoryBreakdown[];
  /** Em ordem cronológica; inclui transferências e ajustes. Compras no cartão entram pela fatura. */
  transactions: Transaction[];
  /** Gastos fixos já lançados com data neste mês (inclui os no cartão, que contam na fatura seguinte). */
  launchedRecurringIds: string[];
};

export type StatementMovement = {
  transaction: Transaction;
  /** Quanto o lançamento move o saldo da conta (negativo = saiu). */
  effectInCents: number;
  /** Saldo logo depois do lançamento. */
  balanceInCents: number;
};

export type AccountStatement = {
  /** AAAA-MM */
  month: string;
  openingInCents: number;
  movements: StatementMovement[];
  closingInCents: number;
};

export type Recurring = {
  id: string;
  description: string;
  kind: CategoryKind;
  categoryId: string;
  categoryName: string;
  /** Conta onde cai; nulo quando é no cartão. */
  accountId: string | null;
  accountName: string | null;
  /** Cartão onde cai (só despesa); nulo quando é na conta. */
  cardId: string | null;
  cardName: string | null;
  /** Nulo quando o valor varia e não há referência. */
  amountInCents: number | null;
  /** O valor muda todo mês: `amountInCents` é só uma referência. */
  variableAmount: boolean;
  /** Dia do vencimento, de 1 a 31. */
  dueDay: number;
  active: boolean;
  createdAt: string;
};

export type NewTransaction = {
  kind: TransactionKind;
  description: string;
  /** Parcelado: o total da compra. */
  amountInCents: number;
  date: string;
  categoryId?: string;
  /** Despesa em conta, receita, transferência (origem) e ajuste. */
  accountId?: string;
  /** Despesa no cartão, no lugar da conta. */
  cardId?: string;
  toAccountId?: string;
  /** Pagamento de fatura: transferência para o cartão. */
  toCardId?: string;
  /**
   * AAAA-MM (vencimento). Pagamento de fatura: a fatura quitada. Parcelamento
   * em andamento: a fatura da parcela atual.
   */
  invoiceMonth?: string;
  recurringId?: string;
  /** Compra parcelada no cartão (2 a 48). */
  installmentCount?: number;
  /**
   * Parcelamento que já estava em andamento: a parcela que cai em
   * `invoiceMonth`. Lança dela até a última, e o valor é o de cada parcela.
   */
  currentInstallment?: number;
};

/** Edição: o tipo e o gasto fixo de origem ficam. Nulo tira a conta ou o cartão. */
export type TransactionChanges = {
  description?: string;
  amountInCents?: number;
  date?: string;
  categoryId?: string;
  accountId?: string | null;
  cardId?: string | null;
  toAccountId?: string;
};

export type NewAccount = {
  name: string;
  type: AccountType;
  bankId?: string;
  initialBalanceInCents: number;
  initialBalanceDate: string;
};

/** Edição: o tipo da conta não muda. `bankId: null` tira o banco. */
export type AccountChanges = {
  name: string;
  bankId: string | null;
  initialBalanceInCents: number;
  initialBalanceDate: string;
};

export type NewRecurring = {
  description: string;
  kind: CategoryKind;
  categoryId: string;
  /** Exatamente um entre conta e cartão (cartão só em despesa). */
  accountId: string | null;
  cardId: string | null;
  amountInCents: number | null;
  variableAmount: boolean;
  dueDay: number;
};

/** Edição: o tipo (despesa ou receita) não muda. */
export type RecurringChanges = Omit<NewRecurring, 'kind'> & {
  active: boolean;
};

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  EXPENSE: 'DESPESA',
  INCOME: 'RECEITA',
  TRANSFER: 'TRANSFERÊNCIA',
  ADJUSTMENT: 'AJUSTE',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'CORRENTE',
  CASH: 'DINHEIRO',
  RESERVE: 'RESERVA',
};

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';

export type InvoiceSummary = {
  /** AAAA-MM do vencimento. */
  month: string;
  status: InvoiceStatus;
  /** AAAA-MM-DD */
  closingDate: string;
  /** AAAA-MM-DD */
  dueDate: string;
  totalInCents: number;
  remainingInCents: number;
};

export type Card = {
  id: string;
  name: string;
  bankId: string | null;
  bankName: string | null;
  closingDay: number;
  dueDay: number;
  limitInCents: number | null;
  archived: boolean;
  /** Compras ainda não pagas, de todas as faturas. */
  usedInCents: number;
  /** Nulo quando o cartão não tem limite. */
  availableInCents: number | null;
  /** A fatura que falta pagar ou, sem pendência, a aberta. */
  currentInvoice: InvoiceSummary;
  createdAt: string;
};

export type CardInvoice = InvoiceSummary & {
  cardId: string;
  /** O que sobrou de faturas anteriores; negativo = crédito. */
  previousBalanceInCents: number;
  chargesInCents: number;
  paymentsInCents: number;
  charges: Transaction[];
  payments: Transaction[];
};

export type NewCard = {
  name: string;
  bankId?: string;
  closingDay: number;
  dueDay: number;
  limitInCents?: number;
};

/** Edição: `bankId` e `limitInCents` nulos tiram o banco e o limite. */
export type CardChanges = {
  name: string;
  bankId: string | null;
  closingDay: number;
  dueDay: number;
  limitInCents: number | null;
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN: 'ABERTA',
  CLOSED: 'FECHADA',
  PAID: 'PAGA',
  OVERDUE: 'VENCIDA',
};

export type BudgetStatus = 'OK' | 'WARNING' | 'OVER';

export type BudgetItem = {
  categoryId: string;
  categoryName: string;
  /** O limite que vale neste mês: a exceção, se houver, senão o padrão. */
  limitInCents: number;
  /** Nulo quando a categoria só tem limite neste mês. */
  defaultLimitInCents: number | null;
  /** O limite deste mês é uma exceção. */
  isOverride: boolean;
  spentInCents: number;
  /** Negativo quando estourou. */
  remainingInCents: number;
  /** Gasto sobre o limite (1 = 100%). */
  ratio: number;
  status: BudgetStatus;
};

export type UnbudgetedCategory = {
  categoryId: string;
  categoryName: string;
  spentInCents: number;
};

export type MonthlyBudget = {
  /** AAAA-MM */
  month: string;
  totalLimitInCents: number;
  /** Só das categorias com limite. */
  totalSpentInCents: number;
  /** Do mais perto de estourar para o mais folgado. */
  items: BudgetItem[];
  /** Categorias de despesa sem limite neste mês. */
  unbudgeted: UnbudgetedCategory[];
};

export type Goal = {
  id: string;
  name: string;
  targetInCents: number;
  /** AAAA-MM; nulo sem prazo. */
  deadline: string | null;
  accountId: string;
  accountName: string;
  /** O saldo da conta de reserva. */
  balanceInCents: number;
  /** Fração do alvo (1 = 100%); passa de 1 quando superada. */
  progress: number;
  remainingInCents: number;
  /** Meses até o prazo, contando o atual; nulo sem prazo. */
  monthsLeft: number | null;
  deadlinePassed: boolean;
  /** Quanto guardar por mês; nulo sem prazo ou com o prazo vencido. */
  monthlyNeededInCents: number | null;
  createdAt: string;
};

export type NewGoal = {
  name: string;
  targetInCents: number;
  deadline?: string;
  accountId: string;
};

/** Edição: `deadline` nulo tira o prazo. */
export type GoalChanges = {
  name: string;
  targetInCents: number;
  deadline: string | null;
  accountId: string;
};

export type InsightKind = 'OVERDUE_INVOICE' | 'SPIKE' | 'SUBSCRIPTION';

export type Insight = {
  kind: InsightKind;
  title: string;
  detail: string;
  amountInCents: number;
  /** A categoria (pico) ou o cartão (fatura vencida); nulo na assinatura. */
  refId: string | null;
};

export type Insights = {
  /** AAAA-MM */
  month: string;
  alerts: Insight[];
};

export type CashFlowItem = {
  description: string;
  kind: CategoryKind;
  amountInCents: number;
  /** O valor é uma estimativa (gasto fixo que muda todo mês). */
  estimated: boolean;
};

export type CashFlowMonth = {
  /** AAAA-MM */
  month: string;
  openingInCents: number;
  incomeInCents: number;
  expenseInCents: number;
  closingInCents: number;
  items: CashFlowItem[];
};

export type CashFlow = {
  months: CashFlowMonth[];
};

/** Filtros da busca entre meses (os mesmos nomes da API). Vazio = sem o filtro. */
export type TransactionSearch = {
  text?: string;
  /** AAAA-MM */
  from: string;
  /** AAAA-MM */
  to: string;
  kind?: TransactionKind;
  categoryId?: string;
  /** Conta ou cartão, como origem ou destino. */
  originId?: string;
};

export type TransactionSearchResult = {
  /** Quantos casam com os filtros, em todas as páginas. */
  total: number;
  /** Somas de todos os resultados; compra no cartão conta pela fatura. */
  incomeInCents: number;
  expenseInCents: number;
  /** Do mais novo para o mais antigo. */
  transactions: Transaction[];
};

/** Lançamentos por página na busca. */
export const SEARCH_PAGE_SIZE = 50;
/** O máximo que a API aceita no MUDAR CATEGORIA. */
export const MAX_RECATEGORIZE = 200;
