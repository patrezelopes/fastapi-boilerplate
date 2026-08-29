import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenHolder, useSessionStore } from "@/features/session-store";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
});

describe("session store", () => {
  it("guarda o token só em memória", () => {
    tokenHolder.write("abc", 900);

    expect(tokenHolder.read()).toBe("abc");
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("devolve null quando o token já expirou", () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    tokenHolder.write("abc", 900);

    vi.spyOn(Date, "now").mockReturnValue(900_001);

    expect(tokenHolder.read()).toBeNull();
  });

  it("limpa a sessão", () => {
    tokenHolder.write("abc", 900);

    tokenHolder.clear();

    expect(tokenHolder.read()).toBeNull();
    expect(useSessionStore().session).toBeNull();
  });

  it("marca a restauração como concluída", () => {
    const store = useSessionStore();
    expect(store.restored).toBe(false);

    store.markRestored();

    expect(store.restored).toBe(true);
  });
});
