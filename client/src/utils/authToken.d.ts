export function parseJwtPayload(token: string): Record<string, unknown> | null;
export function getBearerToken(): string | null;
export function canUseSupportChat(): boolean;
export function isAdminPanelToken(token: string): boolean;
