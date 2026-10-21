import { createHash, randomBytes, randomUUID } from 'node:crypto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A sessão vale 30 dias desde que foi aberta. */
export const SESSION_LIFETIME_MS = 30 * DAY_MS;

/** ...e acaba antes se ficar 7 dias sem uso. */
export const SESSION_INACTIVITY_MS = 7 * DAY_MS;

/** O último uso é regravado no máximo a cada hora, para não escrever no banco a cada requisição. */
export const SESSION_TOUCH_INTERVAL_MS = 60 * 60 * 1000;

/** Token aleatório de 256 bits: é o que o navegador guarda. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Só o hash do token vai para o banco: um vazamento da tabela não dá sessões válidas. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface NewSession {
  userId: string;
  tokenHash: string;
  now: Date;
}

export class Session {
  private _id: string;
  private _userId: string;
  private _tokenHash: string;
  private _expiresAt: Date;
  private _lastUsedAt: Date;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    lastUsedAt: Date,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._tokenHash = tokenHash;
    this._expiresAt = expiresAt;
    this._lastUsedAt = lastUsedAt;
    this._createdAt = createdAt;
  }

  static create({ userId, tokenHash, now }: NewSession): Session {
    return new Session(
      randomUUID(),
      userId,
      tokenHash,
      new Date(now.getTime() + SESSION_LIFETIME_MS),
      now,
      now,
    );
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get lastUsedAt(): Date {
    return this._lastUsedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isExpiredAt(now: Date): boolean {
    return (
      now.getTime() >= this._expiresAt.getTime() ||
      now.getTime() - this._lastUsedAt.getTime() >= SESSION_INACTIVITY_MS
    );
  }

  /** Marca o uso; devolve se mudou (só regrava de hora em hora). */
  touch(now: Date): boolean {
    if (
      now.getTime() - this._lastUsedAt.getTime() <
      SESSION_TOUCH_INTERVAL_MS
    ) {
      return false;
    }

    this._lastUsedAt = now;

    return true;
  }
}
