import { randomUUID } from 'node:crypto';
import { validPositiveAmount, validSignedAmount } from './Amounts';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_DESCRIPTION_LENGTH } from './Limits';
import { validIsoDate } from './IsoDate';
import { Month } from './Month';

export type TransactionKind = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';

export const MIN_INSTALLMENTS = 2;
export const MAX_INSTALLMENTS = 48;

export interface NewTransaction {
  /** Dono do lançamento: vem da sessão, nunca do corpo da requisição. */
  userId: string;
  kind: TransactionKind;
  description: string;
  /** Positivo, exceto no ajuste (sinal da correção do saldo). Parcelado: o total da compra. */
  amountInCents: number;
  /** AAAA-MM-DD */
  date: string;
  /** Despesa e receita; transferência e ajuste não têm categoria. */
  categoryId?: string | null;
  /** Conta de origem: receita, transferência e ajuste; despesa quando não é no cartão. */
  accountId?: string | null;
  /** Despesa no cartão de crédito, no lugar da conta. */
  cardId?: string | null;
  /** Transferência para outra conta. */
  toAccountId?: string | null;
  /** Transferência para um cartão: pagamento de fatura. */
  toCardId?: string | null;
  /**
   * AAAA-MM da fatura (mês do vencimento): da compra no cartão, ou da fatura
   * que o pagamento quita. Quem sabe calcular é o cartão; o domínio só confere.
   */
  invoiceMonth?: string | null;
  /** Gasto fixo de origem; só despesa e receita. */
  recurringId?: string | null;
  /** Compra parcelada no cartão; use createInstallments. */
  installmentCount?: number;
  /**
   * Parcelamento que já estava em andamento: a parcela que cai em
   * `invoiceMonth`. Com ela, `amountInCents` é o valor de cada parcela; use
   * continueInstallments.
   */
  currentInstallment?: number;
}

export interface TransactionProps {
  id: string;
  userId: string;
  kind: TransactionKind;
  description: string;
  amountInCents: number;
  date: string;
  categoryId: string | null;
  accountId: string | null;
  cardId: string | null;
  toAccountId: string | null;
  toCardId: string | null;
  invoiceMonth: string | null;
  /** Mesmo valor em todas as parcelas de uma compra. */
  purchaseId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  recurringId: string | null;
  createdAt: Date;
}

/** O que dá para mudar depois de lançado: o tipo, o gasto fixo e as parcelas ficam. */
export type TransactionChanges = Partial<
  Pick<
    TransactionProps,
    | 'description'
    | 'amountInCents'
    | 'date'
    | 'categoryId'
    | 'accountId'
    | 'cardId'
    | 'toAccountId'
    | 'toCardId'
    | 'invoiceMonth'
  >
>;

/** Os únicos campos que `change` aceita. */
const EDITABLE_FIELDS = [
  'description',
  'amountInCents',
  'date',
  'categoryId',
  'accountId',
  'cardId',
  'toAccountId',
  'toCardId',
  'invoiceMonth',
] as const satisfies readonly (keyof TransactionChanges)[];

function count(...values: (string | null)[]): number {
  return values.filter((value) => value !== null).length;
}

/**
 * Valida a combinação de campos que cada tipo exige. Devolve as props já
 * normalizadas (descrição aparada) ou recusa.
 */
function validate(props: TransactionProps): TransactionProps {
  const description = props.description.trim();

  if (description === '') {
    throw new FinanceValidationError('A descrição é obrigatória');
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new FinanceValidationError(
      `A descrição deve ter até ${MAX_DESCRIPTION_LENGTH} caracteres`,
    );
  }

  validIsoDate(props.date);

  const { kind } = props;
  const hasCategory = kind === 'EXPENSE' || kind === 'INCOME';

  if (kind === 'ADJUSTMENT') {
    validSignedAmount(props.amountInCents);

    if (props.amountInCents === 0) {
      throw new FinanceValidationError('O ajuste não pode ser zero');
    }
  } else {
    validPositiveAmount(props.amountInCents);
  }

  if (hasCategory && props.categoryId === null) {
    throw new FinanceValidationError('A categoria é obrigatória');
  }

  if (!hasCategory && props.categoryId !== null) {
    throw new FinanceValidationError(
      'Transferência e ajuste não têm categoria',
    );
  }

  // Origem do dinheiro: só a despesa pode sair do cartão.
  if (kind === 'EXPENSE') {
    if (count(props.accountId, props.cardId) !== 1) {
      throw new FinanceValidationError('Escolha a conta ou o cartão');
    }
  } else {
    if (props.accountId === null) {
      throw new FinanceValidationError('A conta é obrigatória');
    }

    if (props.cardId !== null) {
      throw new FinanceValidationError('Só a despesa pode ser no cartão');
    }
  }

  // Destino: só a transferência tem, e é uma conta ou um cartão (fatura).
  if (kind === 'TRANSFER') {
    if (count(props.toAccountId, props.toCardId) !== 1) {
      throw new FinanceValidationError(
        'Informe a conta ou o cartão de destino',
      );
    }

    if (props.toAccountId !== null && props.toAccountId === props.accountId) {
      throw new FinanceValidationError(
        'A conta de destino deve ser diferente da de origem',
      );
    }
  } else if (props.toAccountId !== null || props.toCardId !== null) {
    throw new FinanceValidationError('Só a transferência tem destino');
  }

  // Fatura: a da compra no cartão, ou a que o pagamento quita.
  const needsInvoice =
    (kind === 'EXPENSE' && props.cardId !== null) ||
    (kind === 'TRANSFER' && props.toCardId !== null);

  if (needsInvoice) {
    if (props.invoiceMonth === null) {
      throw new FinanceValidationError('Informe a fatura');
    }

    Month.parse(props.invoiceMonth);
  } else if (props.invoiceMonth !== null) {
    throw new FinanceValidationError(
      'Só compra no cartão e pagamento de fatura têm fatura',
    );
  }

  const installmentFields = [
    props.purchaseId,
    props.installmentNumber,
    props.installmentCount,
  ];

  if (installmentFields.some((field) => field !== null)) {
    const { installmentNumber, installmentCount } = props;
    const valid =
      installmentFields.every((field) => field !== null) &&
      kind === 'EXPENSE' &&
      props.cardId !== null &&
      installmentCount !== null &&
      installmentNumber !== null &&
      installmentCount >= MIN_INSTALLMENTS &&
      installmentCount <= MAX_INSTALLMENTS &&
      installmentNumber >= 1 &&
      installmentNumber <= installmentCount;

    if (!valid) {
      throw new FinanceValidationError('Parcelas inválidas');
    }
  }

  if (props.recurringId !== null && !hasCategory) {
    throw new FinanceValidationError(
      'Só despesa e receita vêm de um gasto fixo',
    );
  }

  return { ...props, description };
}

/**
 * Qualquer movimento de dinheiro: despesa (na conta ou no cartão), receita,
 * transferência entre contas, pagamento de fatura ou ajuste de saldo. É
 * sempre o domínio que valida a combinação de campos.
 */
export class Transaction {
  private _props: TransactionProps;

  constructor(props: TransactionProps) {
    this._props = validate(props);
  }

  static create(input: NewTransaction): Transaction {
    return new Transaction(Transaction.propsOf(input));
  }

  /**
   * Compra parcelada no cartão: devolve uma parcela por fatura, a partir de
   * `input.invoiceMonth` (a da primeira). O total é dividido sem arredondar
   * para cima: os centavos que sobram vão na primeira parcela.
   */
  static createInstallments(input: NewTransaction): Transaction[] {
    const installmentCount = Transaction.validInstallmentCount(input);
    const total = validPositiveAmount(input.amountInCents);

    if (total < installmentCount) {
      throw new FinanceValidationError(
        'O valor total deve ter ao menos um centavo por parcela',
      );
    }

    const base = Math.floor(total / installmentCount);
    const remainder = total - base * installmentCount;

    return Transaction.installments(input, installmentCount, 1, (number) =>
      number === 1 ? base + remainder : base,
    );
  }

  /**
   * Parcelamento que já estava em andamento antes de usar o app: lança só o
   * que falta, da `input.currentInstallment` (na fatura `input.invoiceMonth`)
   * até a última, todas com o valor da parcela. As já pagas ficam de fora:
   * lançadas, deixariam as faturas passadas em aberto.
   */
  static continueInstallments(input: NewTransaction): Transaction[] {
    const installmentCount = Transaction.validInstallmentCount(input);
    const current = input.currentInstallment ?? 0;

    if (
      !Number.isInteger(current) ||
      current < 1 ||
      current > installmentCount
    ) {
      throw new FinanceValidationError(
        `A parcela atual deve ser de 1 a ${installmentCount}`,
      );
    }

    const amount = validPositiveAmount(input.amountInCents);

    return Transaction.installments(
      input,
      installmentCount,
      current,
      () => amount,
    );
  }

  private static validInstallmentCount(input: NewTransaction): number {
    const installmentCount = input.installmentCount ?? 0;

    if (
      !Number.isInteger(installmentCount) ||
      installmentCount < MIN_INSTALLMENTS ||
      installmentCount > MAX_INSTALLMENTS
    ) {
      throw new FinanceValidationError(
        `O número de parcelas deve ser de ${MIN_INSTALLMENTS} a ${MAX_INSTALLMENTS}`,
      );
    }

    if (input.kind !== 'EXPENSE' || !input.cardId || !input.invoiceMonth) {
      throw new FinanceValidationError(
        'Só compra no cartão pode ser parcelada',
      );
    }

    return installmentCount;
  }

  /**
   * Da parcela `firstNumber` até a última, uma por fatura a partir de
   * `input.invoiceMonth`, todas ligadas à mesma compra e com a mesma data.
   */
  private static installments(
    input: NewTransaction,
    installmentCount: number,
    firstNumber: number,
    amountOf: (installmentNumber: number) => number,
  ): Transaction[] {
    const firstInvoice = Month.parse(input.invoiceMonth as string);
    const purchaseId = randomUUID();
    const createdAt = new Date();

    return Array.from(
      { length: installmentCount - firstNumber + 1 },
      (_, index) => {
        const installmentNumber = firstNumber + index;
        const props = Transaction.propsOf({
          ...input,
          amountInCents: amountOf(installmentNumber),
          invoiceMonth: firstInvoice.plus(index).toString(),
        });

        return new Transaction({
          ...props,
          purchaseId,
          installmentNumber,
          installmentCount,
          createdAt,
        });
      },
    );
  }

  private static propsOf(input: NewTransaction): TransactionProps {
    return {
      id: randomUUID(),
      userId: input.userId,
      kind: input.kind,
      description: input.description,
      amountInCents: input.amountInCents,
      date: input.date,
      categoryId: input.categoryId ?? null,
      accountId: input.accountId ?? null,
      cardId: input.cardId ?? null,
      toAccountId: input.toAccountId ?? null,
      toCardId: input.toCardId ?? null,
      invoiceMonth: input.invoiceMonth ?? null,
      purchaseId: null,
      installmentNumber: null,
      installmentCount: null,
      recurringId: input.recurringId ?? null,
      createdAt: new Date(),
    };
  }

  /**
   * Aplica as mudanças de uma vez e revalida a combinação inteira: campos
   * soltos deixariam estados intermediários inválidos (ex.: trocar conta e destino).
   */
  change(changes: TransactionChanges): void {
    const next: Record<string, unknown> = { ...this._props };

    // Lista fixa: um corpo com id, userId, kind, purchaseId etc. não passa.
    for (const field of EDITABLE_FIELDS) {
      if (changes[field] !== undefined) {
        next[field] = changes[field];
      }
    }

    this._props = validate(next as unknown as TransactionProps);
  }

  get id(): string {
    return this._props.id;
  }

  /** Imutável: o dono dos dados. */
  get userId(): string {
    return this._props.userId;
  }

  /** Imutável. */
  get kind(): TransactionKind {
    return this._props.kind;
  }

  get description(): string {
    return this._props.description;
  }

  get amountInCents(): number {
    return this._props.amountInCents;
  }

  get date(): string {
    return this._props.date;
  }

  get categoryId(): string | null {
    return this._props.categoryId;
  }

  get accountId(): string | null {
    return this._props.accountId;
  }

  get cardId(): string | null {
    return this._props.cardId;
  }

  get toAccountId(): string | null {
    return this._props.toAccountId;
  }

  get toCardId(): string | null {
    return this._props.toCardId;
  }

  get invoiceMonth(): string | null {
    return this._props.invoiceMonth;
  }

  /** Imutável: a compra parcelada não troca de parcelas. */
  get purchaseId(): string | null {
    return this._props.purchaseId;
  }

  get installmentNumber(): number | null {
    return this._props.installmentNumber;
  }

  get installmentCount(): number | null {
    return this._props.installmentCount;
  }

  /** Imutável: o lançamento não troca de gasto fixo. */
  get recurringId(): string | null {
    return this._props.recurringId;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  /** AAAA-MM do mês em que o lançamento conta nos relatórios: o da fatura, se foi no cartão. */
  get reportMonth(): string {
    const { kind, cardId, invoiceMonth, date } = this._props;

    return kind === 'EXPENSE' && cardId !== null && invoiceMonth !== null
      ? invoiceMonth
      : date.slice(0, 7);
  }
}
