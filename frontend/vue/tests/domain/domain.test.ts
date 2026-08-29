import { describe, expect, it } from "vitest";
import { isEmpty, isLastPage, type Page } from "@/domain/page";
import {
  fieldErrorsOf,
  firstMessage,
  isNotFound,
  isUnauthorized,
  messageOf,
  ProblemError,
} from "@/domain/problem";
import { hasExpired, sessionFrom } from "@/domain/session";
import { initialsOf } from "@/domain/user";

const page = <T>(over: Partial<Page<T>> = {}): Page<T> => ({
  items: [],
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  ...over,
});

describe("user", () => {
  it.each([
    ["Ana Maria Souza", "AS"],
    ["Ana", "A"],
    ["  ana   souza  ", "AS"],
    ["", "?"],
    ["   ", "?"],
  ])("iniciais de %j são %s", (name, esperado) => {
    expect(initialsOf({ name })).toBe(esperado);
  });
});

describe("session", () => {
  it("calcula a expiração a partir da vida em segundos", () => {
    expect(sessionFrom("t", 900, 1_000)).toEqual({ accessToken: "t", expiresAt: 901_000 });
  });

  it("expira no instante exato, não depois", () => {
    const session = sessionFrom("t", 900, 0);
    expect(hasExpired(session, 899_999)).toBe(false);
    expect(hasExpired(session, 900_000)).toBe(true);
  });
});

describe("page", () => {
  it("reconhece a última página", () => {
    expect(isLastPage(page({ page: 2, totalPages: 2 }))).toBe(true);
    expect(isLastPage(page({ page: 1, totalPages: 2 }))).toBe(false);
  });

  it("reconhece resultado vazio", () => {
    expect(isEmpty(page({ total: 0 }))).toBe(true);
    expect(isEmpty(page({ total: 3 }))).toBe(false);
  });
});

describe("problem", () => {
  const validation = new ProblemError({
    type: "…/validation",
    title: "Validation failed",
    status: 422,
    detail: "Campos inválidos.",
    errors: [{ field: "email", message: "formato inválido" }],
  });

  it("mapeia errors[] para um dicionário por campo", () => {
    expect(fieldErrorsOf(validation)).toEqual({ email: "formato inválido" });
  });

  it("devolve dicionário vazio para erro que não é Problem", () => {
    expect(fieldErrorsOf(new Error("qualquer"))).toEqual({});
    expect(fieldErrorsOf(null)).toEqual({});
  });

  it("prefere detail a title na mensagem", () => {
    expect(messageOf(validation)).toBe("Campos inválidos.");
    expect(messageOf(new ProblemError({ type: "t", title: "Só o título", status: 500 }))).toBe(
      "Só o título",
    );
  });

  it("cai no texto padrão quando não há nada legível", () => {
    expect(messageOf(undefined)).toBe("Algo deu errado. Tente de novo.");
    expect(messageOf(new Error(""), "outro")).toBe("outro");
    expect(messageOf(new Error("erro comum"))).toBe("erro comum");
  });

  it("classifica 401 e 404", () => {
    const naoAutorizado = new ProblemError({ type: "t", title: "U", status: 401 });
    const naoEncontrado = new ProblemError({ type: "t", title: "N", status: 404 });

    expect(isUnauthorized(naoAutorizado)).toBe(true);
    expect(isUnauthorized(naoEncontrado)).toBe(false);
    expect(isNotFound(naoEncontrado)).toBe(true);
    expect(isNotFound(new Error("x"))).toBe(false);
  });
});

describe("firstMessage", () => {
  it("devolve a primeira mensagem existente", () => {
    expect(firstMessage(undefined, "do servidor")).toBe("do servidor");
    expect(firstMessage("local", "do servidor")).toBe("local");
  });

  it("ignora string vazia e devolve undefined quando não há nenhuma", () => {
    expect(firstMessage("", "válida")).toBe("válida");
    expect(firstMessage(undefined, undefined)).toBeUndefined();
    expect(firstMessage()).toBeUndefined();
  });
});
