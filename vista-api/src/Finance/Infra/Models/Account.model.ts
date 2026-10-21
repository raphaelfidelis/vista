import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import type { AccountType } from '../../Domain/Account';
import { BankModel } from './Bank.model';

@Entity('accounts')
@Index(['userId', 'name'], { unique: true })
export class AccountModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Account.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  type!: AccountType;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bankId!: string | null;

  /** Só para a chave estrangeira. RESTRICT reforça no banco a regra que o service já aplica. */
  @ManyToOne(() => BankModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'bankId' })
  bank?: BankModel | null;

  @Column({ type: 'integer' })
  initialBalanceInCents!: number;

  /** Coluna date: o TypeORM devolve string AAAA-MM-DD, sem fuso. */
  @Column({ type: 'date' })
  initialBalanceDate!: string;

  @Column({ type: 'boolean' })
  archived!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
