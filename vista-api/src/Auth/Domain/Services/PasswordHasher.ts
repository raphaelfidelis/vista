export const PASSWORD_HASHER = Symbol('PasswordHasher');

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /** Hash malformado conta como senha errada. */
  verify(hash: string, password: string): Promise<boolean>;
}
