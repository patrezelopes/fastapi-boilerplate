---
name: react-feature
description: Criar uma tela ou comportamento no SPA React deste repositório — hooks em features, componentes em ui, página em app, e como ligar os três. Use ao mexer em frontend/react, ao adicionar rota, formulário ou consulta.
---

# Uma tela no SPA React

Leia primeiro `.claude/rules/frontend.md` e a skill `frontend-parity`. Aqui é a mecânica.

## Onde vai cada peça

```
src/features/<recurso>/use-<recurso>.ts   hooks: TanStack Query + mutações
src/ui/<componente>.tsx                   apresentação, recebe props e emite callbacks
src/app/pages/<nome>-page.tsx             a página, que junta os dois
src/app/router.tsx                        a rota
```

`features` não importa `ui`. Se uma página precisa dos dois, ela mora em `app`.

## Consulta

```tsx
export function useUsers(query: UserQuery) {
  return useQuery<Page<User>>({
    queryKey: ["users", query],
    queryFn: () => usersRepository.list(query),
    placeholderData: keepPreviousData,   // sem isso, paginar pisca a lista inteira
  });
}
```

O repositório vem de `features/container.ts`, nunca instanciado na página.

## Formulário

`react-hook-form` + `zodResolver`. O erro de campo pode vir da validação local **ou** do
servidor; `firstMessage` resolve a precedência:

```tsx
const serverErrors = fieldErrorsOf(mutation.error);

<Field
  label="E-mail"
  error={firstMessage(formState.errors.email?.message, serverErrors["email"])}
  {...register("email")}
/>
```

Erro que não é de campo vira `<Alert tone="error">{messageOf(mutation.error)}</Alert>`.

## Os quatro estados

Toda tela que busca dados trata carregando, vazio, erro e conteúdo — use `Loading`,
`Empty`, `Failed` de `ui/states.tsx`. Uma tela que só trata o caminho feliz não está pronta.

## Complexidade

O limite é 10 por função, e uma página com muitos `??` estoura fácil. Quando estourar,
extraia — foi assim que `firstMessage` e `LoadFailure` nasceram.

## Portões

```bash
cd frontend/react && make lint && make test
```

Cobertura: 80% global, 90% em `domain/` e `data/`. `app/` fica de fora — quem a verifica
é o Playwright.
