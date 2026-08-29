import { Injectable, inject } from "@angular/core";
import type { Credentials, Registration } from "../../data/auth-repository";
import type { User } from "../../domain/user";
import { AUTH_REPOSITORY } from "../repositories";
import { SessionService } from "../session.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly repository = inject(AUTH_REPOSITORY);
  private readonly session = inject(SessionService);

  readonly isAuthenticated = this.session.isAuthenticated;
  readonly restored = this.session.restored;

  async login(credentials: Credentials): Promise<void> {
    this.session.set(await this.repository.login(credentials));
  }

  async register(registration: Registration): Promise<User> {
    return this.repository.register(registration);
  }

  async logout(): Promise<void> {
    await this.repository.logout().catch(() => undefined);
    this.session.clear();
  }

  me(): Promise<User> {
    return this.repository.me();
  }

  /**
   * Ao abrir a aplicação o access token não existe — ele vive em memória e a
   * página acabou de carregar. Uma chamada a `/auth/me` dispara a renovação
   * silenciosa pelo cookie, e só então sabemos se há sessão.
   */
  async restoreSession(): Promise<void> {
    if (this.session.restored()) return;
    await this.repository.me().catch(() => null);
    this.session.markRestored();
  }
}
