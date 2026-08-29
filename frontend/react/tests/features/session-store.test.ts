import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenHolder, useSessionStore } from "@/features/session-store";

beforeEach(() => {
  useSessionStore.setState({ session: null, restored: false });
  vi.restoreAllMocks();
});

describe("session store", () => {
  it("guarda o token só em memória", () => {
    tokenHolder.write("abc", 900);

    expect(tokenHolder.read()).toBe("abc");
    expect(localStorage.getItem("session")).toBeNull();
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
    expect(useSessionStore.getState().session).toBeNull();
  });

  it("marca a restauração como concluída", () => {
    expect(useSessionStore.getState().restored).toBe(false);

    useSessionStore.getState().markRestored();

    expect(useSessionStore.getState().restored).toBe(true);
  });
});
