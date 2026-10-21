import { User } from '../User';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** O e-mail já normalizado (User.normalizeEmail). */
  findByEmail(email: string): Promise<User | null>;
  /** Lança AuthEmailTakenError se o e-mail já tem conta, inclusive numa corrida. */
  save(user: User): Promise<void>;
}
