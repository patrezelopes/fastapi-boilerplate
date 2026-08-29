import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogin, useLogout, useRegister, useRestoreSession } from "@/features/auth/use-auth";
import { useHealth } from "@/features/health/use-health";
import { useSessionStore } from "@/features/session-store";
import { useCreateUser, useDeleteUser, useUsers } from "@/features/users/use-users";

// vi.hoisted porque vi.mock é içado para o topo do arquivo: sem isto, as
// constantes ainda não existem quando a fábrica roda.
const { authRepository, usersRepository, healthRepository } = vi.hoisted(() => ({
  authRepository: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
  usersRepository: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  healthRepository: { check: vi.fn() },
}));

vi.mock("@/features/container", () => ({ authRepository, usersRepository, healthRepository }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.setState({ session: null, restored: false });
});

describe("useLogin", () => {
  it("guarda a sessão devolvida", async () => {
    authRepository.login.mockResolvedValue({ accessToken: "abc", expiresAt: Date.now() + 900_000 });
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "a@b.com", password: "x" });
    });

    await waitFor(() => {
      expect(useSessionStore.getState().session?.accessToken).toBe("abc");
    });
  });

  it("expõe o erro sem derrubar a aplicação", async () => {
    authRepository.login.mockRejectedValue(new Error("401"));
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "a@b.com", password: "x" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(useSessionStore.getState().session).toBeNull();
  });
});

describe("useRegister", () => {
  it("cria a conta sem abrir sessão", async () => {
    authRepository.register.mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useRegister(), { wrapper });

    act(() => {
      result.current.mutate({ email: "a@b.com", name: "Ana", password: "senha-longa-123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(useSessionStore.getState().session).toBeNull();
  });
});

describe("useRestoreSession", () => {
  it("tenta restaurar uma vez e marca como concluído", async () => {
    authRepository.me.mockRejectedValue(new Error("401"));
    renderHook(
      () => {
        useRestoreSession();
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(useSessionStore.getState().restored).toBe(true);
    });
    expect(authRepository.me).toHaveBeenCalledOnce();
  });

  it("não tenta de novo depois de restaurada", async () => {
    useSessionStore.setState({ restored: true });
    renderHook(
      () => {
        useRestoreSession();
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(authRepository.me).not.toHaveBeenCalled();
    });
  });
});

describe("useLogout", () => {
  it("limpa a sessão mesmo se a chamada falhar", async () => {
    useSessionStore.setState({ session: { accessToken: "abc", expiresAt: Date.now() + 1000 } });
    authRepository.logout.mockRejectedValue(new Error("rede"));
    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current();
    });

    expect(useSessionStore.getState().session).toBeNull();
  });
});

describe("useUsers", () => {
  it("busca a página pedida", async () => {
    usersRepository.list.mockResolvedValue({
      items: [],
      page: 2,
      perPage: 10,
      total: 0,
      totalPages: 0,
    });
    const { result } = renderHook(() => useUsers({ page: 2, perPage: 10 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(usersRepository.list).toHaveBeenCalledWith({ page: 2, perPage: 10 });
  });
});

describe("mutações de usuário", () => {
  it("cria", async () => {
    usersRepository.create.mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useCreateUser(), { wrapper });

    act(() => {
      result.current.mutate({ email: "a@b.com", name: "Ana", password: "senha-longa-123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("remove", async () => {
    usersRepository.remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    act(() => {
      result.current.mutate("1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(usersRepository.remove).toHaveBeenCalledWith("1");
  });
});

describe("useHealth", () => {
  it("expõe o relatório das sondas", async () => {
    healthRepository.check.mockResolvedValue({ alive: true, ready: false });
    const { result } = renderHook(() => useHealth(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual({ alive: true, ready: false });
    });
  });
});
