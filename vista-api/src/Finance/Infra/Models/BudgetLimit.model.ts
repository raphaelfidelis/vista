import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../../Auth/Infra/Models/User.model';
import { CategoryModel } from './Category.model';

@Entity('budgetLimits')
export class BudgetLimitModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Uma categoria tem no máximo um limite padrão. */
  @PrimaryColumn('uuid')
  categoryId!: string;

  /** Só para a chave estrangeira. RESTRICT reforça no banco a regra que o service já aplica. */
  @ManyToOne(() => CategoryModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryModel;

  @Column({ type: 'integer' })
  amountInCents!: number;
}
