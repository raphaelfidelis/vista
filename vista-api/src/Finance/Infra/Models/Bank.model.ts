import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';

@Entity('banks')
@Index(['userId', 'name'], { unique: true })
export class BankModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Bank.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
