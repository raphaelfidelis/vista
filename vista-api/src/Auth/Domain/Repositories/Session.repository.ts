import { Session } from '../Session';

export const SESSION_REPOSITORY = Symbol('SessionRepository');

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
  /** Encerra as sessões do usuário, menos a que continua. */
  deleteOthers(userId: string, keepId: string): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
  /** As vencidas pelo prazo ou pela inatividade. */
  deleteExpired(now: Date): Promise<void>;
}
