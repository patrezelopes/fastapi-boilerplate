import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { computed, type ComputedRef } from "vue";
import type { Credentials, Registration } from "@/data/auth-repository";
import type { User } from "@/domain/user";
import { authRepository } from "../container";
import { useSessionStore } from "../session-store";

export function useIsAuthenticated(): ComputedRef<boolean> {
  const { session } = storeToRefs(useSessionStore());
  return computed(() => session.value !== null);
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
  const store = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => authRepository.login(credentials),
    onSuccess: (session) => {
      store.setSession(session);
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
  const store = useSessionStore();
  const queryClient = useQueryClient();

  return async function logout(): Promise<void> {
    await authRepository.logout().catch(() => undefined);
    store.setSession(null);
    queryClient.clear();
  };
}
