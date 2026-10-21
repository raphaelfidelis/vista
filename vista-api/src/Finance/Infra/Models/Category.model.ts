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

@Entity('categories')
@Index(['userId', 'kind', 'name'], { unique: true })
export class CategoryModel {
  /** Dono dos dados: toda consulta filtra por ele. */
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira. */
  @ManyToOne(() => UserModel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** Gerado no domínio (Category.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  kind!: CategoryKind;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
