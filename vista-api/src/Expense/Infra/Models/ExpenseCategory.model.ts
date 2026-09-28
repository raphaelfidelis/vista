import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('expenseCategories')
export class ExpenseCategoryModel {
  /** Gerado no domínio (`ExpenseCategory.create`), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
