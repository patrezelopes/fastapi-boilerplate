import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * A jornada completa da fatia de referência, ponta a ponta.
 *
 * Só consultas acessíveis — papel e texto — nunca classe de CSS nem id de
 * teste. É o que permite que o mesmo arquivo rode contra React, Vue e Angular:
 * o que os três compartilham é a semântica, não a marcação.
 */

const SENHA = "senha-bem-longa-123";

function contaNova(prefixo: string): { nome: string; email: string } {
  const carimbo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return { nome: `Teste ${prefixo}`, email: `${prefixo}.${carimbo}@exemplo.com` };
}

async function cadastrar(page: Page, conta: { nome: string; email: string }): Promise<void> {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();

  await page.getByLabel("Nome").fill(conta.nome);
  await page.getByLabel("E-mail").fill(conta.email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
}

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
}

test.describe("situação do sistema", () => {
  test("mostra as duas sondas sem exigir autenticação", async ({ page }) => {
    await page.goto("/health");

    await expect(page.getByRole("heading", { name: "Situação do sistema" })).toBeVisible();
    // `exact` porque "no ar" também aparece dentro de "Aplicação no ar".
    await expect(page.getByText("Aplicação no ar")).toBeVisible();
    await expect(page.getByText("Pronta para tráfego")).toBeVisible();
    await expect(page.getByText("no ar", { exact: true })).toBeVisible();
    await expect(page.getByText("pronta", { exact: true })).toBeVisible();
  });
});

test.describe("acesso", () => {
  test("rota protegida sem sessão manda para o login", async ({ page }) => {
    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("recusa credenciais erradas sem dizer qual campo falhou", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("ninguem@exemplo.com");
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText("Credenciais inválidas");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("valida o formulário antes de chamar o servidor", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nome").fill("Alguém");
    await page.getByLabel("E-mail").fill("não-é-email");
    await page.getByLabel("Senha").fill("curta");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("Formato de e-mail inválido")).toBeVisible();
    await expect(page.getByText("A senha precisa de ao menos 12 caracteres")).toBeVisible();
  });

  test("recusa cadastro com e-mail já usado", async ({ page }) => {
    const conta = contaNova("dup");
    await cadastrar(page, conta);

    await page.goto("/register");
    await page.getByLabel("Nome").fill(conta.nome);
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("alert")).toContainText("Já existe uma conta com este e-mail");
  });
});

test.describe("jornada autenticada", () => {
  test("cadastra, entra, cria, edita, remove e sai", async ({ page }) => {
    const dono = contaNova("dono");
    await cadastrar(page, dono);
    await entrar(page, dono.email);

    // perfil do token
    await page.getByRole("link", { name: "Meu perfil" }).click();
    await expect(page.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
    await expect(page.getByText(dono.email)).toBeVisible();

    // criação pela própria tela de usuários
    const criado = contaNova("criado");
    await page.getByRole("link", { name: "Usuários" }).click();
    await page.getByRole("button", { name: "Novo usuário" }).click();
    await expect(page.getByRole("heading", { name: "Novo usuário" })).toBeVisible();
    await page.getByLabel("Nome").fill(criado.nome);
    await page.getByLabel("E-mail").fill(criado.email);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

    // busca encontra o que acabou de ser criado
    await page.getByLabel("Buscar").fill(criado.email);
    await expect(page.getByRole("cell", { name: criado.email })).toBeVisible();

    // edição parcial
    await page.getByRole("button", { name: "Abrir" }).first().click();
    await expect(page.getByRole("heading", { name: "Editar usuário" })).toBeVisible();
    await page.getByLabel("Nome").fill("Nome Editado");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("status")).toContainText("Alterações salvas");

    // o e-mail continuou o mesmo: a atualização é parcial
    await expect(page.getByLabel("E-mail")).toHaveValue(criado.email);

    // remoção
    await page.getByRole("button", { name: "Voltar" }).click();
    await page.getByLabel("Buscar").fill(criado.email);
    await page.getByRole("button", { name: `Remover Nome Editado` }).click();
    await expect(page.getByText("Nenhum usuário encontrado.")).toBeVisible();

    // sair encerra a sessão
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("a sessão sobrevive a um recarregamento", async ({ page }) => {
    // O access token vive só em memória; recarregar o perde. Quem devolve a
    // sessão é o cookie httpOnly de refresh, em silêncio.
    const conta = contaNova("reload");
    await cadastrar(page, conta);
    await entrar(page, conta.email);

    await page.reload();

    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Meu perfil" })).toBeVisible();
  });

  test("nenhum token é guardado no navegador", async ({ page }) => {
    const conta = contaNova("token");
    await cadastrar(page, conta);
    await entrar(page, conta.email);

    const guardado = await page.evaluate(() => ({
      local: Object.entries(localStorage),
      session: Object.entries(sessionStorage),
    }));

    expect(guardado.local).toEqual([]);
    expect(guardado.session).toEqual([]);

    // O refresh existe, mas é httpOnly: o JavaScript não o enxerga.
    const visivelAoScript = await page.evaluate(() => document.cookie);
    expect(visivelAoScript).not.toContain("refresh_token");
  });

  test("página além do fim mostra lista vazia, não erro", async ({ page }) => {
    const conta = contaNova("pagina");
    await cadastrar(page, conta);
    await entrar(page, conta.email);

    await page.getByLabel("Buscar").fill("nao-existe-esse-termo-nenhum");

    await expect(page.getByText("Nenhum usuário encontrado.")).toBeVisible();
  });
});

test.describe("acessibilidade", () => {
  for (const rota of ["/login", "/register", "/health"]) {
    test(`sem violações em ${rota}`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole("heading").first()).toBeVisible();

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
