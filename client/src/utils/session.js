import { isValidAdminToken } from './adminAuth';

/** Текущий пользователь из localStorage (включая админа по adminToken) */
export function resolveCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    /* ignore */
  }
  if (isValidAdminToken(localStorage.getItem('adminToken'))) {
    return { role: 'admin', email: 'dinastia_admin' };
  }
  return null;
}

export const ADMIN_LOGIN_USERNAME = 'dinastia_admin';

export function isAdminUsername(value) {
  return value.trim().toLowerCase() === ADMIN_LOGIN_USERNAME;
}
