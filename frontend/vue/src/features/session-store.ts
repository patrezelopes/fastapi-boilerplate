import { defineStore } from "pinia";
import { ref } from "vue";
import type { TokenHolder } from "@/data/token-holder";
import { type Session, hasExpired, sessionFrom } from "@/domain/session";

/**
 * Sem plugin de persistência, e isso é deliberado: o access token vive só
 * enquanto a aba viver. Recarregar a página o perde, e o cookie httpOnly de
 * refresh o traz de volta em silêncio.
 */
export const useSessionStore = defineStore("session", () => {
  const session = ref<Session | null>(null);
  /** Já tentamos restaurar a sessão pelo cookie de refresh? */
  const restored = ref(false);

  function setSession(next: Session | null): void {
    session.value = next;
  }

  function markRestored(): void {
    restored.value = true;
  }

  return { session, restored, setSession, markRestored };
});

/** A implementação do port que `data` declara. */
export const tokenHolder: TokenHolder = {
  read() {
    const { session } = useSessionStore();
    if (!session || hasExpired(session)) return null;
    return session.accessToken;
  },
  write(accessToken, expiresInSeconds) {
    useSessionStore().setSession(sessionFrom(accessToken, expiresInSeconds));
  },
  clear() {
    useSessionStore().setSession(null);
  },
};
