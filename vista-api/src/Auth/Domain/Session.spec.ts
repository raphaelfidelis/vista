import {
  generateSessionToken,
  hashSessionToken,
  Session,
  SESSION_INACTIVITY_MS,
  SESSION_LIFETIME_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from './Session';

const USER = '11111111-1111-4111-8111-111111111111';
const OPENED = new Date('2026-10-13T12:00:00Z');
const after = (ms: number) => new Date(OPENED.getTime() + ms);
const DAY = 24 * 60 * 60 * 1000;

function open(): Session {
  return Session.create({ userId: USER, tokenHash: 'hash', now: OPENED });
}

describe('token', () => {
  it('é aleatório e tem 256 bits', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();

    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('só o hash vai para o banco: SHA-256 em hexadecimal, sem revelar o token', () => {
    const hash = hashSessionToken('abc');

    expect(hash).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hash).not.toContain('abc');
  });
});

describe('Session', () => {
  it('nasce válida por 30 dias', () => {
    const session = open();

    expect(session.expiresAt.getTime()).toBe(
      OPENED.getTime() + SESSION_LIFETIME_MS,
    );
    expect(session.lastUsedAt).toEqual(OPENED);
    expect(session.isExpiredAt(OPENED)).toBe(false);
    expect(session.isExpiredAt(after(DAY))).toBe(false);
  });

  it('vence no prazo absoluto, mesmo usada o tempo todo', () => {
    const session = open();

    // Usada a cada 6 dias: nunca fica inativa, mas 30 dias é o teto.
    for (let day = 6; day <= 30; day += 6) {
      session.touch(after(day * DAY));
    }

    expect(session.isExpiredAt(after(30 * DAY - 1))).toBe(false);
    expect(session.isExpiredAt(after(30 * DAY))).toBe(true);
  });

  it('vence com 7 dias sem uso', () => {
    const session = open();

    expect(session.isExpiredAt(after(SESSION_INACTIVITY_MS - 1))).toBe(false);
    expect(session.isExpiredAt(after(SESSION_INACTIVITY_MS))).toBe(true);
  });

  it('o uso adia o vencimento por inatividade', () => {
    const session = open();

    session.touch(after(5 * DAY));

    expect(session.isExpiredAt(after(11 * DAY))).toBe(false);
    expect(session.isExpiredAt(after(12 * DAY))).toBe(true);
  });

  describe('touch', () => {
    it('não regrava antes de uma hora', () => {
      const session = open();

      expect(session.touch(after(SESSION_TOUCH_INTERVAL_MS - 1))).toBe(false);
      expect(session.lastUsedAt).toEqual(OPENED);
    });

    it('regrava depois de uma hora', () => {
      const session = open();
      const later = after(SESSION_TOUCH_INTERVAL_MS);

      expect(session.touch(later)).toBe(true);
      expect(session.lastUsedAt).toEqual(later);
    });
  });
});
