import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useLogin, useLogout, useRegister } from "@/features/auth/use-auth";
import { useHealth } from "@/features/health/use-health";
import { useSessionStore } from "@/features/session-store";
import { useDeleteUser, useUsers } from "@/features/users/use-users";

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

/** Monta um componente só para dar contexto de Vue aos composables. */
function withSetup<T>(composable: () => T): T {
  let exposed!: T;
  mount(
    defineComponent({
      setup() {
        exposed = composable();
        return () => h("div");
      },
    }),
    { global: { plugins: [VueQueryPlugin] } },
  );
  return exposed;
}

const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("useLogin", () => {
  it("guarda a sessão devolvida", async () => {
    authRepository.login.mockResolvedValue({ accessToken: "abc", expiresAt: Date.now() + 900_000 });
    const login = withSetup(() => useLogin());

    login.mutate({ email: "a@b.com", password: "x" });
    await settle();

    expect(useSessionStore().session?.accessToken).toBe("abc");
  });

  it("expõe o erro sem abrir sessão", async () => {
    authRepository.login.mockRejectedValue(new Error("401"));
    const login = withSetup(() => useLogin());

    login.mutate({ email: "a@b.com", password: "x" });
    await settle();

    expect(login.isError.value).toBe(true);
    expect(useSessionStore().session).toBeNull();
  });
});

describe("useRegister", () => {
  it("cria a conta sem abrir sessão", async () => {
    authRepository.register.mockResolvedValue({ id: "1" });
    const registrar = withSetup(() => useRegister());

    registrar.mutate({ email: "a@b.com", name: "Ana", password: "senha-longa-123" });
    await settle();

    expect(registrar.isSuccess.value).toBe(true);
    expect(useSessionStore().session).toBeNull();
  });
});

describe("useLogout", () => {
  it("limpa a sessão mesmo se a chamada falhar", async () => {
    authRepository.logout.mockRejectedValue(new Error("rede"));
    const logout = withSetup(() => useLogout());
    useSessionStore().setSession({ accessToken: "abc", expiresAt: Date.now() + 1000 });

    await logout();

    expect(useSessionStore().session).toBeNull();
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
    withSetup(() => useUsers({ page: 2, perPage: 10 }));

    await settle();

    expect(usersRepository.list).toHaveBeenCalledWith({ page: 2, perPage: 10 });
  });
});

describe("useDeleteUser", () => {
  it("remove pelo id", async () => {
    usersRepository.remove.mockResolvedValue(undefined);
    const remover = withSetup(() => useDeleteUser());

    remover.mutate("1");
    await settle();

    expect(usersRepository.remove).toHaveBeenCalledWith("1");
  });
});

describe("useHealth", () => {
  it("expõe o relatório das sondas", async () => {
    healthRepository.check.mockResolvedValue({ alive: true, ready: false });
    const health = withSetup(() => useHealth());

    await settle();

    expect(health.data.value).toEqual({ alive: true, ready: false });
  });
});
