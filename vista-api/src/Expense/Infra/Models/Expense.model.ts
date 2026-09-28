import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ExpenseCategoryModel } from './ExpenseCategory.model';

@Entity('expenses')
export class ExpenseModel {
  /** Gerado no domínio (`Expense.create`), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer' })
  amountInCents!: number;

  /** Coluna `date`: o TypeORM devolve string AAAA-MM-DD, sem fuso. */
  @Index()
  @Column({ type: 'date' })
  date!: string;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  /** Só para a chave estrangeira. `RESTRICT` reforça no banco a regra que o service já aplica. */
  @ManyToOne(() => ExpenseCategoryModel, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: ExpenseCategoryModel;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
