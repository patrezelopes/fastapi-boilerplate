import { Injectable, computed, signal } from "@angular/core";
import type { TokenHolder } from "../data/token-holder";
import { type Session, hasExpired, sessionFrom } from "../domain/session";

/**
 * Sem persistência, e isso é deliberado: o access token vive só enquanto a aba
 * viver. Recarregar a página o perde, e o cookie httpOnly de refresh o traz de
 * volta em silêncio.
 */
@Injectable({ providedIn: "root" })
export class SessionService implements TokenHolder {
  private readonly session = signal<Session | null>(null);
  /** Já tentamos restaurar a sessão pelo cookie de refresh? */
  private readonly restoredSignal = signal(false);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly restored = this.restoredSignal.asReadonly();

  read(): string | null {
    const current = this.session();
    if (!current || hasExpired(current)) return null;
    return current.accessToken;
  }

  write(accessToken: string, expiresInSeconds: number): void {
    this.session.set(sessionFrom(accessToken, expiresInSeconds));
  }

  clear(): void {
    this.session.set(null);
  }

  set(session: Session | null): void {
    this.session.set(session);
  }

  markRestored(): void {
    this.restoredSignal.set(true);
  }
}
