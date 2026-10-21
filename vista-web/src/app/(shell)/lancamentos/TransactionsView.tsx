'use client';

import Form from 'next/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  iconButton,
  primaryButton,
  secondaryButton,
} from '@/components/buttons';
import { Drawer } from '@/components/Drawer';
import { fieldClass } from '@/components/Field';
import { ManageCategoriesDialog } from '@/components/ManageCategoriesDialog';
import { StatCard } from '@/components/StatCard';
import {
  TransactionForm,
  type TransactionPreset,
} from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import {
  TRANSACTION_KIND_LABELS,
  type Account,
  type Card,
  type Category,
  type MonthlyReport,
  type Recurring,
  type Transaction,
  type TransactionKind,
} from '@/lib/finance';
import {
  formatCents,
  formatChange,
  formatShare,
  formatSignedCents,
} from '@/lib/money';
import { MAX_SEARCH_TEXT_LENGTH } from '@/lib/limits';
import { dueDateIn, formatMonth, shiftMonth } from '@/lib/month';
import { createCategory, deleteCategory, renameCategory } from './actions';
import { ExpenseChart } from './ExpenseChart';
import { RecurringChecklist } from './RecurringChecklist';
import { RecurringDialog } from './RecurringDialog';

type TransactionsViewProps = {
  report: MonthlyReport;
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  recurring: Recurring[];
  defaultDate: string;
  /** Veio do + da barra inferior (?novo=1): abre o formulário de novo lançamento. */
  openNew?: boolean;
};

/** O que está aberto na lateral: nada, o formulário (novo, edição ou vindo de um gasto fixo) ou os cadastros. */
type Panel =
  | {
      kind: 'form';
      transaction: Transaction | null;
      preset?: TransactionPreset;
    }
  | { kind: 'categories' }
  | { kind: 'recurring' }
  | null;

type KindFilter = 'ALL' | TransactionKind;

function monthHref(month: string): string {
  return `/lancamentos?mes=${month}`;
}

/** Título do painel de edição, conforme o que está sendo editado. */
function editTitle(transaction: Transaction): string {
  if (transaction.purchaseId !== null) {
    return 'EDITAR COMPRA PARCELADA';
  }

  return transaction.toCardId === null
    ? `EDITAR ${TRANSACTION_KIND_LABELS[transaction.kind]}`
    : 'EDITAR PAGAMENTO DE FATURA';
}

export function TransactionsView({
  report,
  categories,
  accounts,
  cards,
  recurring,
  defaultDate,
  openNew = false,
}: TransactionsViewProps) {
  const router = useRouter();
  const canCreate = accounts.some((account) => !account.archived);
  const [panel, setPanel] = useState<Panel>(
    openNew && canCreate ? { kind: 'form', transaction: null } : null,
  );
  // Tocar no + já estando nesta tela não remonta a view: abre aqui, ao mudar a prop.
  const [handledNew, setHandledNew] = useState(openNew);

  if (openNew !== handledNew) {
    setHandledNew(openNew);

    if (openNew && canCreate) {
      setPanel({ kind: 'form', transaction: null });
    }
  }

  // Tira o novo=1 da URL: voltar no navegador não reabre o formulário.
  useEffect(() => {
    if (openNew) {
      router.replace(`/lancamentos?mes=${report.month}`, { scroll: false });
    }
  }, [openNew, report.month, router]);
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');
  const [originFilter, setOriginFilter] = useState('');
  const previousMonth = shiftMonth(report.month, -1);
  const empty = report.transactions.length === 0;
  const fixedShare =
    report.expenseInCents === 0
      ? null
      : report.fixedExpenseInCents / report.expenseInCents;
  const download = `/lancamentos/xlsx?mes=${report.month}`;
  const visible = report.transactions.filter(
    (transaction) =>
      (kindFilter === 'ALL' || transaction.kind === kindFilter) &&
      (originFilter === '' ||
        [
          transaction.accountId,
          transaction.cardId,
          transaction.toAccountId,
          transaction.toCardId,
        ].includes(originFilter)),
  );

  function fill(item: Recurring) {
    setPanel({
      kind: 'form',
      transaction: null,
      preset: {
        kind: item.kind,
        description: item.description,
        amountInCents: item.amountInCents,
        date: dueDateIn(report.month, item.dueDay),
        categoryId: item.categoryId,
        accountId: item.accountId ?? undefined,
        cardId: item.cardId ?? undefined,
        recurringId: item.id,
      },
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={monthHref(previousMonth)}
            aria-label="Mês anterior"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_left
            </span>
          </Link>
          <span className="font-sans w-28 text-center text-lg font-bold">
            {formatMonth(report.month)}
          </span>
          <Link
            href={monthHref(shiftMonth(report.month, 1))}
            aria-label="Próximo mês"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_right
            </span>
          </Link>
        </div>
        <Form
          role="search"
          action="/lancamentos/busca"
          className="hidden items-center gap-1 md:flex"
        >
          <input
            name="texto"
            type="search"
            maxLength={MAX_SEARCH_TEXT_LENGTH}
            placeholder="Buscar em todos os meses"
            aria-label="Buscar lançamentos"
            className={`${fieldClass} w-56`}
          />
          <button type="submit" aria-label="Buscar" className={iconButton}>
            <span aria-hidden className="icon text-[18px]">
              search
            </span>
          </button>
        </Form>
        <Link
          href="/lancamentos/busca"
          aria-label="Buscar lançamentos"
          className={`${iconButton} ml-auto md:hidden`}
        >
          <span aria-hidden className="icon text-[20px]">
            search
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          <button
            type="button"
            onClick={() => setPanel({ kind: 'categories' })}
            className={secondaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              tune
            </span>
            <span className="md:hidden">CATEGORIAS</span>
            <span className="hidden md:inline">GERENCIAR CATEGORIAS</span>
          </button>
          <button
            type="button"
            onClick={() => setPanel({ kind: 'recurring' })}
            className={secondaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              event_repeat
            </span>
            <span className="md:hidden">FIXOS</span>
            <span className="hidden md:inline">GERENCIAR FIXOS</span>
          </button>
          <a href={download} download className={secondaryButton}>
            <span aria-hidden className="icon text-[16px]">
              download
            </span>
            <span className="md:hidden">.XLSX</span>
            <span className="hidden md:inline">BAIXAR .XLSX</span>
          </a>
          <button
            type="button"
            disabled={!canCreate}
            title={canCreate ? undefined : 'Crie uma conta primeiro'}
            onClick={() => setPanel({ kind: 'form', transaction: null })}
            className={`${primaryButton} max-md:hidden`}
          >
            <span aria-hidden className="icon text-[16px]">
              add
            </span>
            NOVO LANÇAMENTO
          </button>
        </div>
      </div>

      {!canCreate && (
        <p className="text-muted text-xs">
          Crie uma conta em{' '}
          <Link href="/contas" className="text-accent underline">
            CONTAS
          </Link>{' '}
          para lançar movimentos.
        </p>
      )}
      {canCreate && categories.length === 0 && (
        <p className="text-muted text-xs">
          Crie categorias em GERENCIAR CATEGORIAS para lançar receitas e
          despesas.
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <StatCard label="RECEITAS" value={formatCents(report.incomeInCents)} />
        <StatCard
          label="DESPESAS"
          value={formatCents(report.expenseInCents)}
          hint={`${formatChange(report.expenseChange)} vs ${formatMonth(previousMonth)} · cartão pela fatura`}
        />
        <StatCard
          label="RESULTADO"
          value={formatSignedCents(report.resultInCents)}
          hint="receitas − despesas"
        />
        <StatCard
          label="FIXOS"
          value={formatCents(report.fixedExpenseInCents)}
          hint={`variáveis ${formatCents(report.variableExpenseInCents)} · ${formatShare(fixedShare)} fixo`}
        />
      </div>

      <RecurringChecklist
        month={report.month}
        recurring={recurring}
        transactions={report.transactions}
        launchedIds={report.launchedRecurringIds}
        onFill={fill}
      />

      {empty ? (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUM LANÇAMENTO EM {formatMonth(report.month)}
        </p>
      ) : (
        <>
          {report.expenseCategories.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-dim text-[10px] tracking-[0.22em]">
                DESPESAS POR CATEGORIA
              </h2>
              <ExpenseChart
                month={report.month}
                previousMonth={previousMonth}
                categories={report.expenseCategories}
              />
              <CategoryTable categories={report.expenseCategories} />
            </section>
          )}

          {report.incomeCategories.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-dim text-[10px] tracking-[0.22em]">
                RECEITAS POR CATEGORIA
              </h2>
              <CategoryTable categories={report.incomeCategories} />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-dim text-[10px] tracking-[0.22em]">
                LANÇAMENTOS
              </h2>
              <div className="flex w-full flex-wrap gap-2 md:ml-auto md:w-auto">
                <select
                  aria-label="Filtrar por tipo"
                  value={kindFilter}
                  onChange={(event) =>
                    setKindFilter(event.target.value as KindFilter)
                  }
                  className={`${fieldClass} min-w-0 flex-1 md:w-auto md:flex-none`}
                >
                  <option value="ALL">TODOS OS TIPOS</option>
                  {(
                    Object.entries(TRANSACTION_KIND_LABELS) as [
                      TransactionKind,
                      string,
                    ][]
                  ).map(([kind, label]) => (
                    <option key={kind} value={kind}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrar por conta ou cartão"
                  value={originFilter}
                  onChange={(event) => setOriginFilter(event.target.value)}
                  className={`${fieldClass} min-w-0 flex-1 md:w-auto md:flex-none`}
                >
                  <option value="">TODAS AS CONTAS E CARTÕES</option>
                  <optgroup label="Contas">
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cartões">
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <TransactionList
              transactions={visible}
              categories={categories}
              onEdit={(transaction) => setPanel({ kind: 'form', transaction })}
            />
            {visible.length === 0 && (
              <p className="text-dim py-4 text-center text-xs">
                Nenhum lançamento com esses filtros.
              </p>
            )}
          </section>
        </>
      )}

      {panel?.kind === 'form' && (
        <Drawer
          title={
            panel.transaction ? editTitle(panel.transaction) : 'NOVO LANÇAMENTO'
          }
          onClose={() => setPanel(null)}
        >
          <TransactionForm
            transaction={panel.transaction}
            preset={panel.preset}
            categories={categories}
            accounts={accounts}
            cards={cards}
            defaultDate={defaultDate}
            onSaved={() => setPanel(null)}
          />
        </Drawer>
      )}
      {panel?.kind === 'recurring' && (
        <RecurringDialog
          recurring={recurring}
          categories={categories}
          accounts={accounts}
          cards={cards}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.kind === 'categories' && (
        <ManageCategoriesDialog
          categories={categories}
          create={createCategory}
          rename={renameCategory}
          remove={deleteCategory}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  );
}

type CategoryTableProps = {
  categories: MonthlyReport['expenseCategories'];
};

function CategoryTable({ categories }: CategoryTableProps) {
  return (
    <table className="w-full border-separate border-spacing-y-1 text-sm">
      <thead>
        <tr className="text-dim text-[10px] tracking-[0.2em]">
          <th className="px-3 text-left font-normal">CATEGORIA</th>
          <th className="px-3 text-right font-normal">TOTAL</th>
          <th className="px-3 text-right font-normal">PARTICIPAÇÃO</th>
          <th className="hidden px-3 text-right font-normal @2xl:table-cell">
            ANTERIOR
          </th>
          <th className="hidden px-3 text-right font-normal @2xl:table-cell">
            DIFERENÇA
          </th>
          <th className="hidden px-3 text-right font-normal @2xl:table-cell">
            VARIAÇÃO
          </th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <tr key={category.categoryId} className="bg-item">
            <td className="px-3 py-2.5">{category.categoryName}</td>
            <td className="px-3 text-right">
              {formatCents(category.totalInCents)}
            </td>
            <td className="text-secondary px-3 text-right">
              {formatShare(category.share)}
            </td>
            <td className="text-secondary hidden px-3 text-right @2xl:table-cell">
              {formatCents(category.previousTotalInCents)}
            </td>
            <td className="text-secondary hidden px-3 text-right @2xl:table-cell">
              {formatCents(category.differenceInCents)}
            </td>
            <td className="text-secondary hidden px-3 text-right @2xl:table-cell">
              {formatChange(category.change)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
