import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

/** Расширяет Express Request — body, params, query наследуются автоматически */
export interface AuthRequest extends Request {
  user?: AuthUser;
}
