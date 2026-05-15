function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isValidAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const payload = parseJwtPayload(token);
  return payload?.role === 'admin';
}

/** Доступ в /admin: отдельный adminToken или пользовательский JWT с role admin */
export function canAccessAdminRoute() {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  return isValidAdminToken(adminToken) || isValidAdminToken(userToken);
}
