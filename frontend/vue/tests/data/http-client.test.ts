import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "@/data/http-client";
import type { TokenHolder } from "@/data/token-holder";
import { ProblemError } from "@/domain/problem";

function holder(initial: string | null = null): TokenHolder & { value: string | null } {
  return {
    value: initial,
    read() {
      return this.value;
    },
    write(token: string) {
      this.value = token;
    },
    clear() {
      this.value = null;
    },
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const problem = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/problem+json" },
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpClient", () => {
  it("anexa o Bearer quando há token", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await new HttpClient("/api/v1", holder("abc")).request("/users");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer abc");
  });

  it("não anexa Authorization sem token", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));

    await new HttpClient("/api/v1", holder()).request("/health");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("devolve null em 204 sem tentar interpretar corpo", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(new HttpClient("/api/v1", holder("t")).request("/users/1")).resolves.toBeNull();
  });

  it("converte o envelope RFC 9457 em ProblemError", async () => {
    fetchMock.mockResolvedValue(
      problem(409, {
        type: "…/conflict",
        title: "Conflict",
        status: 409,
        detail: "E-mail em uso.",
      }),
    );

    await expect(new HttpClient("/api/v1", holder("t")).request("/users")).rejects.toMatchObject({
      problem: { status: 409, detail: "E-mail em uso." },
    });
  });

  it("produz um Problem genérico quando o corpo do erro é ilegível", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 502, statusText: "Bad Gateway" }));

    const erro = await new HttpClient("/api/v1", holder("t"))
      .request("/users")
      .catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ProblemError);
    expect((erro as ProblemError).problem.status).toBe(502);
  });

  it("renova o token em 401 e repete a requisição original", async () => {
    const tokens = holder("velho");
    fetchMock
      .mockResolvedValueOnce(problem(401, { type: "t", title: "U", status: 401 }))
      .mockResolvedValueOnce(json({ access_token: "novo", expires_in: 900 }))
      .mockResolvedValueOnce(json({ id: "1" }));

    const resultado = await new HttpClient("/api/v1", tokens).request("/users/1");

    expect(resultado).toEqual({ id: "1" });
    expect(tokens.value).toBe("novo");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("renova uma única vez para várias requisições simultâneas", async () => {
    // Sem isto, N chamadas em 401 disparariam N rotações — e a detecção de
    // reuso do backend derrubaria a sessão, tratando o cliente como atacante.
    const tokens = holder("velho");
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        return Promise.resolve(json({ access_token: "novo", expires_in: 900 }));
      }
      const authorization = new Headers(init?.headers).get("Authorization");
      return Promise.resolve(
        authorization === "Bearer novo"
          ? json({ ok: true })
          : problem(401, { type: "t", title: "U", status: 401 }),
      );
    });

    const client = new HttpClient("/api/v1", tokens);
    await Promise.all([
      client.request("/users"),
      client.request("/users/1"),
      client.request("/auth/me"),
    ]);

    const rotacoes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"));
    expect(rotacoes).toHaveLength(1);
  });

  it("não tenta renovar nas rotas de sessão", async () => {
    fetchMock.mockResolvedValue(problem(401, { type: "t", title: "U", status: 401 }));

    await expect(
      new HttpClient("/api/v1", holder()).request("/auth/login", { method: "POST", body: "{}" }),
    ).rejects.toBeInstanceOf(ProblemError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("limpa a sessão e avisa quando a renovação falha", async () => {
    const tokens = holder("velho");
    const perdeuSessao = vi.fn();
    fetchMock
      .mockResolvedValueOnce(problem(401, { type: "t", title: "U", status: 401 }))
      .mockResolvedValueOnce(problem(401, { type: "t", title: "U", status: 401 }));

    await expect(
      new HttpClient("/api/v1", tokens, perdeuSessao).request("/users"),
    ).rejects.toBeInstanceOf(ProblemError);

    expect(tokens.value).toBeNull();
    expect(perdeuSessao).toHaveBeenCalledOnce();
  });

  it("marca Content-Type apenas quando há corpo", async () => {
    // Uma fábrica, e não um valor: o corpo de uma Response só pode ser lido
    // uma vez, e este teste faz duas requisições.
    fetchMock.mockImplementation(() => Promise.resolve(json({ ok: true })));
    const client = new HttpClient("/api/v1", holder("t"));

    await client.request("/users");
    await client.request("/users", { method: "POST", body: "{}" });

    const [, semCorpo] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [, comCorpo] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(new Headers(semCorpo.headers).has("Content-Type")).toBe(false);
    expect(new Headers(comCorpo.headers).get("Content-Type")).toBe("application/json");
  });
});
