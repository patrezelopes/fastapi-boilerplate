import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_REPOSITORY } from "../repositories";
import { SessionService } from "../session.service";
import { AuthService } from "./auth.service";

const repository = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
};

describe("AuthService", () => {
  let auth: AuthService;
  let session: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repository }],
    });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionService);
  });

  it("guarda a sessão devolvida pelo login", async () => {
    repository.login.mockResolvedValue({ accessToken: "abc", expiresAt: Date.now() + 900_000 });

    await auth.login({ email: "a@b.com", password: "x" });

    expect(session.read()).toBe("abc");
  });

  it("propaga o erro do login sem abrir sessão", async () => {
    repository.login.mockRejectedValue(new Error("401"));

    await expect(auth.login({ email: "a@b.com", password: "x" })).rejects.toThrow("401");
    expect(auth.isAuthenticated()).toBe(false);
  });

  it("registra sem abrir sessão", async () => {
    repository.register.mockResolvedValue({ id: "1" });

    await auth.register({ email: "a@b.com", name: "Ana", password: "senha-longa-123" });

    expect(auth.isAuthenticated()).toBe(false);
  });

  it("limpa a sessão mesmo se o logout falhar", async () => {
    session.write("abc", 900);
    repository.logout.mockRejectedValue(new Error("rede"));

    await auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
  });

  it("tenta restaurar uma vez só", async () => {
    repository.me.mockRejectedValue(new Error("401"));

    await auth.restoreSession();
    await auth.restoreSession();

    expect(repository.me).toHaveBeenCalledOnce();
    expect(auth.restored()).toBe(true);
  });
});
