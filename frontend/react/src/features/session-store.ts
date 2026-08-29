import { create } from "zustand";
import type { TokenHolder } from "@/data/token-holder";
import { type Session, hasExpired, sessionFrom } from "@/domain/session";

interface SessionState {
  session: Session | null;
  /** Já tentamos restaurar a sessão pelo cookie de refresh? */
  restored: boolean;
  setSession: (session: Session | null) => void;
  markRestored: () => void;
}

/**
 * Sem middleware de persistência, e isso é deliberado: o access token vive só
 * enquanto a aba viver. Recarregar a página o perde, e o cookie httpOnly de
 * refresh o traz de volta em silêncio.
 */
export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  restored: false,
  setSession: (session) => {
    set({ session });
  },
  markRestored: () => {
    set({ restored: true });
  },
}));

/** A implementação do port que `data` declara. */
export const tokenHolder: TokenHolder = {
  read() {
    const { session } = useSessionStore.getState();
    if (!session || hasExpired(session)) return null;
    return session.accessToken;
  },
  write(accessToken, expiresInSeconds) {
    useSessionStore.getState().setSession(sessionFrom(accessToken, expiresInSeconds));
  },
  clear() {
    useSessionStore.getState().setSession(null);
  },
};
