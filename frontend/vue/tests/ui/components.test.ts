import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AppAlert from "@/ui/AppAlert.vue";
import AppBadge from "@/ui/AppBadge.vue";
import AppButton from "@/ui/AppButton.vue";
import AppEmpty from "@/ui/AppEmpty.vue";
import AppFailed from "@/ui/AppFailed.vue";
import AppField from "@/ui/AppField.vue";
import AppLoading from "@/ui/AppLoading.vue";
import AppPagination from "@/ui/AppPagination.vue";
import UserTable from "@/ui/UserTable.vue";

describe("AppField", () => {
  it("associa o rótulo ao campo", () => {
    render(AppField, { props: { label: "E-mail" } });

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("anuncia o erro e marca o campo como inválido", () => {
    render(AppField, { props: { label: "E-mail", error: "formato inválido" } });

    expect(screen.getByRole("alert")).toHaveTextContent("formato inválido");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("AppButton", () => {
  it("desabilita e sinaliza enquanto carrega", () => {
    render(AppButton, { props: { loading: true }, slots: { default: "Salvar" } });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("mostra o conteúdo quando não está carregando", () => {
    render(AppButton, { slots: { default: "Salvar" } });

    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});

describe("AppPagination", () => {
  it("não aparece quando há uma página só", () => {
    const { container } = render(AppPagination, { props: { page: 1, totalPages: 1 } });

    expect(container.querySelector("nav")).toBeNull();
  });

  it("navega para a próxima página", async () => {
    const { emitted } = render(AppPagination, { props: { page: 2, totalPages: 3 } });

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(emitted()["change"]).toEqual([[3]]);
  });

  it("trava a anterior na primeira página", () => {
    render(AppPagination, { props: { page: 1, totalPages: 3 } });

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });
});

describe("AppAlert", () => {
  it("usa role de alerta só quando é erro", () => {
    render(AppAlert, { props: { tone: "error" }, slots: { default: "Falhou" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("é informativo por padrão", () => {
    render(AppAlert, { slots: { default: "Aviso" } });
    expect(screen.getByRole("status")).toHaveTextContent("Aviso");
  });
});

describe("estados", () => {
  it("mostra carregando com rótulo próprio ou padrão", () => {
    render(AppLoading);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando…");
  });

  it("aceita rótulo próprio", () => {
    render(AppLoading, { props: { label: "Verificando sessão…" } });
    expect(screen.getByRole("status")).toHaveTextContent("Verificando sessão…");
  });

  it("mostra o vazio", () => {
    render(AppEmpty, { slots: { default: "Nenhum usuário encontrado." } });
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });

  it("oferece nova tentativa só quando há como tentar", async () => {
    const { emitted } = render(AppFailed, { props: { message: "Deu erro", retryable: true } });
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(emitted()["retry"]).toHaveLength(1);
  });

  it("esconde a tentativa quando não é possível repetir", () => {
    render(AppFailed, { props: { message: "Deu erro" } });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("AppBadge", () => {
  it("mostra o texto recebido", () => {
    render(AppBadge, { props: { ok: false }, slots: { default: "fora" } });
    expect(screen.getByText("fora")).toBeInTheDocument();
  });
});

describe("UserTable", () => {
  const user = {
    id: "1",
    email: "ana@exemplo.com",
    name: "Ana Souza",
    createdAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
  };

  it("emite eventos em vez de falar com a API", async () => {
    const { emitted } = render(UserTable, { props: { users: [user] } });

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza" }));

    expect(emitted()["open"]).toEqual([[user]]);
    expect(emitted()["remove"]).toEqual([[user]]);
  });

  it("mostra as iniciais", () => {
    render(UserTable, { props: { users: [user] } });
    expect(screen.getByText("AS")).toBeInTheDocument();
  });
});
