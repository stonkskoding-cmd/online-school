/** Поля user id в JWT (разные версии клиента/сервера) */
export type DecodedJwtPayload = {
  userId?: string;
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
};

/** Извлекает UUID пользователя из payload токена */
export function getUserIdFromJwt(decoded: DecodedJwtPayload): string | undefined {
  const raw = decoded.userId ?? decoded.id ?? decoded.sub;
  if (raw === undefined || raw === null) return undefined;
  const id = String(raw).trim();
  return id.length > 0 ? id : undefined;
}
