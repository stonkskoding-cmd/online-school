/** Разбор payload JWT без проверки подписи (только клиентская эвристика) */
export function parseJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getBearerToken() {
  const token = localStorage.getItem('token')?.trim();
  return token || null;
}

/** Токен с userId/id в payload — подходит для чата поддержки */
export function canUseSupportChat() {
  const token = getBearerToken();
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  const userId = payload.userId ?? payload.id ?? payload.sub;
  return Boolean(userId && String(userId).trim());
}

export function isAdminPanelToken(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  return payload.role === 'admin' && !payload.userId && !payload.id && !payload.sub;
}
