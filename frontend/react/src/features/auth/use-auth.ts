import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { Credentials, Registration } from "@/data/auth-repository";
import type { User } from "@/domain/user";
import { authRepository } from "../container";
import { useSessionStore } from "../session-store";

export function useIsAuthenticated(): boolean {
  return useSessionStore((state) => state.session !== null);
}

export function useSessionRestored(): boolean {
  return useSessionStore((state) => state.restored);
}

/**
 * Ao abrir a aplicação o access token não existe — ele vive em memória e a
 * página acabou de carregar. Uma chamada a `/auth/me` dispara a renovação
 * silenciosa pelo cookie, e só então sabemos se há sessão.
 */
export function useRestoreSession(): void {
  const markRestored = useSessionStore((state) => state.markRestored);
  const restored = useSessionStore((state) => state.restored);

  useEffect(() => {
    if (restored) return;
    void authRepository
      .me()
      .catch(() => null)
      .finally(markRestored);
  }, [restored, markRestored]);
}

export function useCurrentUser() {
  const authenticated = useIsAuthenticated();
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: () => authRepository.me(),
    enabled: authenticated,
  });
}

export function useLogin() {
  const setSession = useSessionStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => authRepository.login(credentials),
    onSuccess: (session) => {
      setSession(session);
      void queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (registration: Registration) => authRepository.register(registration),
  });
}

export function useLogout() {
  const setSession = useSessionStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await authRepository.logout().catch(() => undefined);
    setSession(null);
    queryClient.clear();
  }, [setSession, queryClient]);
}
