import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/ui/alert";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Pagination } from "@/ui/pagination";
import { Empty, Failed, Loading } from "@/ui/states";
import { UserTable } from "@/ui/user-table";

describe("Field", () => {
  it("associa o rótulo ao campo", () => {
    render(<Field label="E-mail" />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("anuncia o erro e marca o campo como inválido", () => {
    render(<Field label="E-mail" error="formato inválido" />);

    expect(screen.getByRole("alert")).toHaveTextContent("formato inválido");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Button", () => {
  it("desabilita e sinaliza enquanto carrega", () => {
    render(<Button loading>Salvar</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("Pagination", () => {
  it("não aparece quando há uma página só", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("desabilita as pontas e navega no meio", async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("trava a anterior na primeira página", () => {
    render(<Pagination page={1} totalPages={3} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });
});

describe("Badge", () => {
  it("mostra o texto recebido", () => {
    render(<Badge ok={false}>fora</Badge>);

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
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    render(<UserTable users={[user]} onOpen={onOpen} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza" }));

    expect(onOpen).toHaveBeenCalledWith(user);
    expect(onRemove).toHaveBeenCalledWith(user);
  });

  it("mostra as iniciais", () => {
    render(<UserTable users={[user]} onOpen={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("AS")).toBeInTheDocument();
  });
});

describe("Alert", () => {
  it("usa role de alerta só quando é erro", () => {
    const { rerender } = render(<Alert tone="error">Falhou</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");

    rerender(<Alert tone="success">Salvo</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Salvo");
  });

  it("é informativo por padrão", () => {
    render(<Alert>Aviso</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Aviso");
  });
});

describe("estados", () => {
  it("mostra carregando com rótulo próprio ou padrão", () => {
    const { rerender } = render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando…");

    rerender(<Loading label="Verificando sessão…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Verificando sessão…");
  });

  it("mostra o vazio", () => {
    render(<Empty>Nenhum usuário encontrado.</Empty>);
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });

  it("oferece nova tentativa quando há como tentar", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<Failed message="Deu erro" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<Failed message="Deu erro" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
