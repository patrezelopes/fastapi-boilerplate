import { InjectionToken, inject } from "@angular/core";
import { AuthRepository } from "../data/auth-repository";
import { HealthRepository } from "../data/health-repository";
import { HttpClient } from "../data/http-client";
import { UsersRepository } from "../data/users-repository";
import { SessionService } from "./session.service";

/**
 * Caminho relativo de propósito: o dev server e o container fazem proxy de
 * `/api` para o backend, de modo que a SPA e a API compartilham a origem. É o
 * que permite ao cookie httpOnly de refresh existir.
 */
const BASE_URL = "/api/v1";

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>("AuthRepository");
export const USERS_REPOSITORY = new InjectionToken<UsersRepository>("UsersRepository");
export const HEALTH_REPOSITORY = new InjectionToken<HealthRepository>("HealthRepository");

/**
 * Reaproveita o cliente de `data/` em vez do HttpClient do Angular.
 *
 * A lógica que importa — anexar o Bearer, detectar 401, renovar em voo único e
 * repetir a requisição — já está escrita e testada ali, e é idêntica nos três
 * SPAs. Reescrevê-la como interceptor do Angular criaria uma terceira versão
 * para divergir, sem ganho: o que o framework ofereceria a mais é DI e teste, e
 * a injeção acontece aqui mesmo, nos tokens abaixo.
 */
export function provideRepositories() {
  const build = () => {
    const session = inject(SessionService);
    return new HttpClient(BASE_URL, session, () => {
      session.clear();
    });
  };

  return [
    { provide: AUTH_REPOSITORY, useFactory: () => new AuthRepository(build()) },
    { provide: USERS_REPOSITORY, useFactory: () => new UsersRepository(build()) },
    { provide: HEALTH_REPOSITORY, useFactory: () => new HealthRepository(build()) },
  ];
}
