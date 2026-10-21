import 'server-only';
import { requestApi, requestPublicApi } from '@/lib/api.server';
import type { SessionResult, User } from '@/lib/auth';

export function login(email: string, password: string): Promise<SessionResult> {
  return requestPublicApi('auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register(input: {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
}): Promise<SessionResult> {
  return requestPublicApi('auth/register', { method: 'POST', body: input });
}

export function getMe(): Promise<User> {
  return requestApi('auth/me');
}

export function rename(name: string): Promise<User> {
  return requestApi('auth/me', { method: 'PATCH', body: { name } });
}

export function changePassword(
  newPassword: string,
  currentPassword?: string,
): Promise<void> {
  return requestApi('auth/me/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });
}

export function logout(): Promise<void> {
  return requestApi('auth/logout', { method: 'POST' });
}
