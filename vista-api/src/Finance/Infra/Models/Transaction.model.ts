import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import type { TransactionKind } from '../../Domain/Transaction';
import { AccountModel } from './Account.model';
import { CardModel } from './Card.model';
import { CategoryModel } from './Category.model';
import { RecurringModel } from './Recurring.model';

@Entity('transactions')
export class TransactionModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Transaction.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  kind!: TransactionKind;

  @Column({ type: 'text' })
  description!: string;

  /** Positivo; no ajuste, com o sinal da correção. Na parcela, o valor dela. */
  @Column({ type: 'integer' })
  amountInCents!: number;

  /** Coluna date: o TypeORM devolve string AAAA-MM-DD, sem fuso. */
  @Index()
  @Column({ type: 'date' })
  date!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId!: string | null;

  /** Só para as chaves estrangeiras. RESTRICT reforça no banco as regras dos services. */
  @ManyToOne(() => CategoryModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryModel | null;

  /** Nulo na despesa no cartão. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @ManyToOne(() => AccountModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'accountId' })
  account?: AccountModel | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  cardId!: string | null;

  @ManyToOne(() => CardModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cardId' })
  card?: CardModel | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  toAccountId!: string | null;

  @ManyToOne(() => AccountModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'toAccountId' })
  toAccount?: AccountModel | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  toCardId!: string | null;

  @ManyToOne(() => CardModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'toCardId' })
  toCard?: CardModel | null;

  /** AAAA-MM (vencimento) da fatura da compra, ou da que o pagamento quita. */
  @Index()
  @Column({ type: 'text', nullable: true })
  invoiceMonth!: string | null;

  /** Mesmo valor em todas as parcelas de uma compra. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  purchaseId!: string | null;

  @Column({ type: 'smallint', nullable: true })
  installmentNumber!: number | null;

  @Column({ type: 'smallint', nullable: true })
  installmentCount!: number | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  recurringId!: string | null;

  @ManyToOne(() => RecurringModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'recurringId' })
  recurring?: RecurringModel | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
