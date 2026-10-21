import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserModel {
  /** Gerado no domínio (User.create), não pelo banco. */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  /** Já normalizado (minúsculo): a unicidade vale sem diferenciar maiúsculas. */
  @Column({ type: 'text', unique: true })
  email!: string;

  /** Nulo para quem entra só com o Google. */
  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;
}
