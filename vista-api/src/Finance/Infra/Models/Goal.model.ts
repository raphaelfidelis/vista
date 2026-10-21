import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import { AccountModel } from './Account.model';

@Entity('goals')
export class GoalModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Goal.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'integer' })
  targetInCents!: number;

  /** AAAA-MM; nulo sem prazo. */
  @Column({ type: 'text', nullable: true })
  deadline!: string | null;

  /** Cada conta tem no máximo uma meta. */
  @Column({ type: 'uuid', unique: true })
  accountId!: string;

  /** Só para a chave estrangeira. RESTRICT reforça no banco a regra que o service já aplica. */
  @OneToOne(() => AccountModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'accountId' })
  account?: AccountModel;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
