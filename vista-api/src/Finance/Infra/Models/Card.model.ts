import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import { BankModel } from './Bank.model';

@Entity('cards')
@Index(['userId', 'name'], { unique: true })
export class CardModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Card.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bankId!: string | null;

  /** Só para a chave estrangeira. RESTRICT reforça no banco a regra que o service já aplica. */
  @ManyToOne(() => BankModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'bankId' })
  bank?: BankModel | null;

  @Column({ type: 'smallint' })
  closingDay!: number;

  @Column({ type: 'smallint' })
  dueDay!: number;

  @Column({ type: 'integer', nullable: true })
  limitInCents!: number | null;

  @Column({ type: 'boolean' })
  archived!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
