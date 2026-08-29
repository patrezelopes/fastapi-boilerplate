import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRepository } from "@/data/auth-repository";
import { HealthRepository } from "@/data/health-repository";
import type { HttpClient } from "@/data/http-client";
import { UsersRepository } from "@/data/users-repository";

const apiUser = {
  id: "1",
  email: "ana@exemplo.com",
  name: "Ana",
  created_at: "2026-01-01T12:00:00Z",
  updated_at: "2026-01-02T12:00:00Z",
};

const domainUser = {
  id: "1",
  email: "ana@exemplo.com",
  name: "Ana",
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-02T12:00:00Z",
};

let request: ReturnType<typeof vi.fn>;
let http: HttpClient;

beforeEach(() => {
  request = vi.fn();
  http = { request } as unknown as HttpClient;
});

describe("AuthRepository", () => {
  it("traduz snake_case da API para camelCase do domínio", async () => {
    request.mockResolvedValue(apiUser);

    await expect(new AuthRepository(http).me()).resolves.toEqual(domainUser);
  });

  it("converte a resposta de login em sessão com expiração", async () => {
    request.mockResolvedValue({ access_token: "abc", token_type: "Bearer", expires_in: 900 });
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    await expect(
      new AuthRepository(http).login({ email: "a@b.com", password: "x" }),
    ).resolves.toEqual({
      accessToken: "abc",
      expiresAt: 901_000,
    });
    vi.restoreAllMocks();
  });

  it("registra enviando o corpo esperado", async () => {
    request.mockResolvedValue(apiUser);

    await new AuthRepository(http).register({
      email: "a@b.com",
      name: "Ana",
      password: "senha-longa-123",
    });

    expect(request).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", name: "Ana", password: "senha-longa-123" }),
    });
  });

  it("encerra a sessão", async () => {
    request.mockResolvedValue(null);

    await new AuthRepository(http).logout();

    expect(request).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
  });
});

describe("UsersRepository", () => {
  it("traduz a página e seus metadados", async () => {
    request.mockResolvedValue({
      items: [apiUser],
      meta: { page: 2, per_page: 10, total: 15, total_pages: 2 },
    });

    await expect(new UsersRepository(http).list({ page: 2, perPage: 10 })).resolves.toEqual({
      items: [domainUser],
      page: 2,
      perPage: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it("monta a query string com os padrões", async () => {
    request.mockResolvedValue({
      items: [],
      meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
    });

    await new UsersRepository(http).list();

    expect(request).toHaveBeenCalledWith("/users?page=1&per_page=20");
  });

  it("inclui o termo de busca só quando há termo", async () => {
    request.mockResolvedValue({
      items: [],
      meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
    });
    const repo = new UsersRepository(http);

    await repo.list({ term: "ana maria" });
    await repo.list({ term: "" });

    expect(request).toHaveBeenNthCalledWith(1, "/users?page=1&per_page=20&q=ana+maria");
    expect(request).toHaveBeenNthCalledWith(2, "/users?page=1&per_page=20");
  });

  it("lê, cria, atualiza e remove", async () => {
    request.mockResolvedValue(apiUser);
    const repo = new UsersRepository(http);

    await expect(repo.get("1")).resolves.toEqual(domainUser);
    await expect(
      repo.create({ email: "a@b.com", name: "Ana", password: "senha-longa-123" }),
    ).resolves.toEqual(domainUser);
    await expect(repo.update("1", { name: "Ana Maria" })).resolves.toEqual(domainUser);

    request.mockResolvedValue(null);
    await repo.remove("1");
    expect(request).toHaveBeenLastCalledWith("/users/1", { method: "DELETE" });
  });
});

describe("HealthRepository", () => {
  it("junta as duas sondas", async () => {
    request.mockResolvedValue({ status: "ok", alive: true, ready: true });

    await expect(new HealthRepository(http).check()).resolves.toEqual({ alive: true, ready: true });
  });

  it("trata sonda que falha como indisponível, sem propagar erro", async () => {
    request
      .mockResolvedValueOnce({ status: "ok", alive: true, ready: true })
      .mockRejectedValueOnce(new Error("503"));

    await expect(new HealthRepository(http).check()).resolves.toEqual({
      alive: true,
      ready: false,
    });
  });
});
