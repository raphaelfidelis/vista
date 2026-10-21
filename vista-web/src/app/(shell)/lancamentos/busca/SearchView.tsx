'use client';

import Form from 'next/form';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { primaryButton, secondaryButton } from '@/components/buttons';
import { Drawer } from '@/components/Drawer';
import { Field, fieldClass, FormError } from '@/components/Field';
import { StatCard } from '@/components/StatCard';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import {
  TRANSACTION_KIND_LABELS,
  type Account,
  type Card,
  type Category,
  type Transaction,
  type TransactionKind,
  type TransactionSearch,
  type TransactionSearchResult,
} from '@/lib/finance';
import { MAX_SEARCH_TEXT_LENGTH } from '@/lib/limits';
import { formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { loadMoreTransactions } from '@/lib/transaction.actions';

type SearchViewProps = {
  filters: TransactionSearch;
  result: TransactionSearchResult;
  error: string | null;
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  defaultDate: string;
};

export function SearchView({
  filters,
  result,
  error,
  categories,
  accounts,
  cards,
  defaultDate,
}: SearchViewProps) {
  const [extra, setExtra] = useState<Transaction[]>([]);
  const [shownResult, setShownResult] = useState(result);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Nova busca, ou recarga depois de editar/excluir: volta à primeira página.
  if (result !== shownResult) {
    setShownResult(result);
    setExtra([]);
    setLoadError(null);
  }

  const transactions = [...result.transactions, ...extra];
  const hasMore = transactions.length < result.total;

  function loadMore() {
    startLoading(async () => {
      try {
        const next = await loadMoreTransactions(filters, transactions.length);

        setExtra((current) => [...current, ...next.transactions]);
      } catch {
        setLoadError('Não foi possível carregar mais. Tente de novo.');
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/lancamentos"
          className="text-muted hover:text-primary flex items-center gap-1 text-[11px] tracking-[0.1em]"
        >
          <span aria-hidden className="icon text-[16px]">
            chevron_left
          </span>
          LANÇAMENTOS
        </Link>
        <h1 className="font-sans text-lg font-bold">Busca</h1>
      </div>

      <Form
        // Filtros novos na URL (inclusive o LIMPAR): o formulário renasce com eles.
        key={JSON.stringify(filters)}
        role="search"
        action="/lancamentos/busca"
        className="grid grid-cols-2 gap-3 @2xl:grid-cols-6"
      >
        <div className="col-span-2 @2xl:col-span-6">
          <Field label="TEXTO">
            <input
              name="texto"
              type="search"
              maxLength={MAX_SEARCH_TEXT_LENGTH}
              defaultValue={filters.text}
              placeholder="ifood, mercado, aluguel…"
              className={fieldClass}
            />
          </Field>
        </div>
        <div className="col-span-2 @md:col-span-1">
          <Field label="DE">
            <input
              name="de"
              type="month"
              defaultValue={filters.from}
              required
              className={fieldClass}
            />
          </Field>
        </div>
        <div className="col-span-2 @md:col-span-1">
          <Field label="ATÉ">
            <input
              name="ate"
              type="month"
              defaultValue={filters.to}
              required
              className={fieldClass}
            />
          </Field>
        </div>
        <Field label="TIPO">
          <select
            // O React não atualiza o defaultValue de um select já montado.
            key={`tipo-${filters.kind ?? ''}`}
            name="tipo"
            defaultValue={filters.kind ?? ''}
            className={fieldClass}
          >
            <option value="">Todos</option>
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
        </Field>
        <Field label="CATEGORIA">
          <select
            key={`categoria-${filters.categoryId ?? ''}`}
            name="categoria"
            defaultValue={filters.categoryId ?? ''}
            className={fieldClass}
          >
            <option value="">Todas</option>
            <optgroup label="Despesas">
              {categories
                .filter((category) => category.kind === 'EXPENSE')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Receitas">
              {categories
                .filter((category) => category.kind === 'INCOME')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="CONTA OU CARTÃO">
            <select
              key={`origem-${filters.originId ?? ''}`}
              name="origem"
              defaultValue={filters.originId ?? ''}
              className={fieldClass}
            >
              <option value="">Todos</option>
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
          </Field>
        </div>
        <div className="col-span-2 flex items-end gap-2 @2xl:col-span-6 @2xl:justify-end">
          <Link
            href="/lancamentos/busca"
            className={`${secondaryButton} flex-1 @2xl:flex-none`}
          >
            LIMPAR
          </Link>
          <button
            type="submit"
            className={`${primaryButton} flex-1 @2xl:flex-none`}
          >
            <span aria-hidden className="icon text-[16px]">
              search
            </span>
            BUSCAR
          </button>
        </div>
      </Form>

      <FormError message={error} />

      {error === null && (
        <>
          <div className="flex flex-wrap gap-4">
            <StatCard
              label="LANÇAMENTOS"
              value={result.total}
              hint={`${formatMonth(filters.from)} → ${formatMonth(filters.to)} · cartão pela fatura`}
            />
            <StatCard
              label="RECEITAS"
              value={formatCents(result.incomeInCents)}
            />
            <StatCard
              label="DESPESAS"
              value={formatCents(result.expenseInCents)}
            />
          </div>

          {result.total === 0 ? (
            <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
              NENHUM LANÇAMENTO COM ESSES FILTROS
            </p>
          ) : (
            <section className="flex flex-col gap-3">
              <TransactionList
                transactions={transactions}
                categories={categories}
                onEdit={setEditing}
              />
              <FormError message={loadError} />
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className={`${secondaryButton} self-center`}
                >
                  {loading
                    ? 'CARREGANDO…'
                    : `CARREGAR MAIS (${result.total - transactions.length} restantes)`}
                </button>
              )}
            </section>
          )}
        </>
      )}

      {editing && (
        <Drawer
          title={`EDITAR ${TRANSACTION_KIND_LABELS[editing.kind]}`}
          onClose={() => setEditing(null)}
        >
          <TransactionForm
            transaction={editing}
            categories={categories}
            accounts={accounts}
            cards={cards}
            defaultDate={defaultDate}
            onSaved={() => setEditing(null)}
          />
        </Drawer>
      )}
    </>
  );
}
