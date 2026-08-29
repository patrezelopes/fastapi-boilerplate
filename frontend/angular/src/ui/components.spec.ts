import { FormControl } from "@angular/forms";
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlertComponent } from "./alert.component";
import { BadgeComponent } from "./badge.component";
import { ButtonComponent } from "./button.component";
import { FieldComponent } from "./field.component";
import { PaginationComponent } from "./pagination.component";
import { EmptyComponent, FailedComponent, LoadingComponent } from "./states.component";
import { UserTableComponent } from "./user-table.component";

describe("FieldComponent", () => {
  it("associa o rótulo ao campo", async () => {
    await render(FieldComponent, {
      inputs: {
        label: "E-mail",
        fieldId: "f1",
        control: new FormControl("", { nonNullable: true }),
      },
    });

    expect(screen.getByLabelText("E-mail")).toBeTruthy();
  });

  it("anuncia o erro e marca o campo como inválido", async () => {
    await render(FieldComponent, {
      inputs: {
        label: "E-mail",
        fieldId: "f2",
        control: new FormControl("", { nonNullable: true }),
        error: "formato inválido",
      },
    });

    expect(screen.getByRole("alert").textContent).toContain("formato inválido");
    expect(screen.getByLabelText("E-mail").getAttribute("aria-invalid")).toBe("true");
  });
});

describe("ButtonComponent", () => {
  it("desabilita e sinaliza enquanto carrega", async () => {
    await render(ButtonComponent, { inputs: { loading: true } });

    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });
});

describe("PaginationComponent", () => {
  it("não aparece quando há uma página só", async () => {
    await render(PaginationComponent, { inputs: { page: 1, totalPages: 1 } });

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("navega para a próxima página", async () => {
    const change = vi.fn();
    await render(PaginationComponent, {
      inputs: { page: 2, totalPages: 3 },
      on: { pageChange: change },
    });

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(change).toHaveBeenCalledWith(3);
  });

  it("trava a anterior na primeira página", async () => {
    await render(PaginationComponent, { inputs: { page: 1, totalPages: 3 } });

    expect(screen.getByRole("button", { name: "Anterior" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("AlertComponent", () => {
  it("usa role de alerta só quando é erro", async () => {
    await render(AlertComponent, { inputs: { tone: "error" } });
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("é informativo por padrão", async () => {
    await render(AlertComponent, {});
    expect(screen.getByRole("status")).toBeTruthy();
  });
});

describe("estados", () => {
  it("mostra carregando com o rótulo padrão", async () => {
    await render(LoadingComponent, {});
    expect(screen.getByRole("status").textContent).toContain("Carregando…");
  });

  it("aceita rótulo próprio", async () => {
    await render(LoadingComponent, { inputs: { label: "Verificando sessão…" } });
    expect(screen.getByRole("status").textContent).toContain("Verificando sessão…");
  });

  it("renderiza o vazio", async () => {
    await render(EmptyComponent, {});
    expect(screen.getByText((_, node) => node?.tagName === "P")).toBeTruthy();
  });

  it("oferece nova tentativa só quando há como tentar", async () => {
    const retry = vi.fn();
    await render(FailedComponent, {
      inputs: { message: "Deu erro", retryable: true },
      on: { retry },
    });

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("esconde a tentativa quando não é possível repetir", async () => {
    await render(FailedComponent, { inputs: { message: "Deu erro" } });
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("BadgeComponent", () => {
  it("marca o estado no atributo de classe", async () => {
    const { container } = await render(BadgeComponent, { inputs: { ok: false } });
    expect(container.querySelector("span")?.className).toContain("bg-red-100");
  });
});

describe("UserTableComponent", () => {
  const user = {
    id: "1",
    email: "ana@exemplo.com",
    name: "Ana Souza",
    createdAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
  };

  it("emite eventos em vez de falar com a API", async () => {
    const open = vi.fn();
    const remove = vi.fn();
    await render(UserTableComponent, { inputs: { users: [user] }, on: { open, remove } });

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza" }));

    expect(open).toHaveBeenCalledWith(user);
    expect(remove).toHaveBeenCalledWith(user);
  });

  it("mostra as iniciais", async () => {
    await render(UserTableComponent, { inputs: { users: [user] } });
    expect(screen.getByText("AS")).toBeTruthy();
  });
});
