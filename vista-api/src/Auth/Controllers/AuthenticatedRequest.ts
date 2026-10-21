import type { Request } from 'express';

/** A requisição depois do AuthGuard: o usuário e a sessão vêm do token, nunca do corpo. */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}
