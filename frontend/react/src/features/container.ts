import { AuthRepository } from "@/data/auth-repository";
import { HealthRepository } from "@/data/health-repository";
import { HttpClient } from "@/data/http-client";
import { UsersRepository } from "@/data/users-repository";
import { tokenHolder, useSessionStore } from "./session-store";

/**
 * Caminho relativo de propósito: o dev server e o container fazem proxy de
 * `/api` para o backend, de modo que a SPA e a API compartilham a origem. É o
 * que permite ao cookie httpOnly de refresh existir.
 */
const BASE_URL = "/api/v1";

const http = new HttpClient(BASE_URL, tokenHolder, () => {
  useSessionStore.getState().setSession(null);
});

export const authRepository = new AuthRepository(http);
export const usersRepository = new UsersRepository(http);
export const healthRepository = new HealthRepository(http);
