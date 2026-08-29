/**
 * O access token vive só em memória. Nunca em localStorage nem sessionStorage:
 * qualquer XSS os leria. Ver `.claude/rules/security.md`.
 */
export interface Session {
  accessToken: string;
  expiresAt: number;
}

export function sessionFrom(
  accessToken: string,
  expiresInSeconds: number,
  now = Date.now(),
): Session {
  return { accessToken, expiresAt: now + expiresInSeconds * 1000 };
}

export function hasExpired(session: Session, now = Date.now()): boolean {
  return session.expiresAt <= now;
}
