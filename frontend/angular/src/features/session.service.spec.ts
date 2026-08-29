import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    session = TestBed.inject(SessionService);
    vi.restoreAllMocks();
  });

  it("guarda o token só em memória", () => {
    session.write("abc", 900);

    expect(session.read()).toBe("abc");
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("devolve null quando o token já expirou", () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    session.write("abc", 900);

    vi.spyOn(Date, "now").mockReturnValue(900_001);

    expect(session.read()).toBeNull();
  });

  it("reflete a autenticação num signal", () => {
    expect(session.isAuthenticated()).toBe(false);

    session.write("abc", 900);

    expect(session.isAuthenticated()).toBe(true);
  });

  it("limpa a sessão", () => {
    session.write("abc", 900);

    session.clear();

    expect(session.read()).toBeNull();
    expect(session.isAuthenticated()).toBe(false);
  });

  it("marca a restauração como concluída", () => {
    expect(session.restored()).toBe(false);

    session.markRestored();

    expect(session.restored()).toBe(true);
  });
});
