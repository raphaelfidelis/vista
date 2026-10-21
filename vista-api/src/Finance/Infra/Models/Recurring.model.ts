import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import type { CategoryKind } from '../../Domain/Category';
import { AccountModel } from './Account.model';
import { CardModel } from './Card.model';
import { CategoryModel } from './Category.model';

@Entity('recurring')
export class RecurringModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Recurring.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  kind!: CategoryKind;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  /** Só para a chave estrangeira. RESTRICT reforça no banco a regra que o service já aplica. */
  @ManyToOne(() => CategoryModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryModel;

  /** Conta onde cai; nulo quando é no cartão. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @ManyToOne(() => AccountModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'accountId' })
  account?: AccountModel | null;

  /** Cartão onde cai (só despesa); nulo quando é na conta. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  cardId!: string | null;

  @ManyToOne(() => CardModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cardId' })
  card?: CardModel | null;

  /** Nulo quando o valor varia e não há referência. */
  @Column({ type: 'integer', nullable: true })
  amountInCents!: number | null;

  @Column({ type: 'boolean' })
  variableAmount!: boolean;

  @Column({ type: 'smallint' })
  dueDay!: number;

  @Column({ type: 'boolean' })
  active!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
