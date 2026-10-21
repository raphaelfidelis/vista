import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from './User.model';

@Entity('sessions')
export class SessionModel {
  /** Gerado no domínio (Session.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** Só para a chave estrangeira: apagar o usuário apaga as sessões dele. */
  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserModel;

  /** SHA-256 do token: o token em si nunca é guardado. */
  @Column({ type: 'text', unique: true })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz' })
  lastUsedAt!: Date;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
