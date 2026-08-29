/**
 * O que `data` precisa saber sobre a sessão — e nada além.
 *
 * É um port: a implementação vive em `features/auth`, que conhece `data`, e não
 * o contrário. Mesma ideia dos ports do backend.
 */
export interface TokenHolder {
  read(): string | null;
  write(accessToken: string, expiresInSeconds: number): void;
  clear(): void;
}
