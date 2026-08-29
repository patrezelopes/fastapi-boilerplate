/**
 * A regra de dependência do frontend, como verificação.
 * Ver .claude/rules/frontend.md.
 *
 *         ┌──────────────┐
 *  app ──▶│ features  ui │──▶  data  ──▶  domain
 *         └──────────────┘
 */
module.exports = {
  forbidden: [
    {
      name: "domain-e-puro",
      severity: "error",
      comment: "domain/ não importa nenhuma outra camada.",
      from: { path: "^src/domain" },
      to: { path: "^src/(data|features|ui|app)" },
    },
    {
      name: "data-so-conhece-domain",
      severity: "error",
      comment: "data/ fala com a API e com domain — nada de UI.",
      from: { path: "^src/data" },
      to: { path: "^src/(features|ui|app)" },
    },
    {
      name: "features-nao-conhece-componente",
      severity: "error",
      comment: "features/ é lógica. Quem junta lógica e componente é app/.",
      from: { path: "^src/features" },
      to: { path: "^src/(ui|app)" },
    },
    {
      name: "ui-nao-conhece-api",
      severity: "error",
      comment: "ui/ recebe dados por props. Um componente roda sem servidor de pé.",
      from: { path: "^src/ui" },
      to: { path: "^src/(data|features|app)" },
    },
    {
      name: "sem-ciclos",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "sem-orfaos",
      severity: "error",
      comment: "Arquivo que ninguém importa é código morto.",
      from: { orphan: true, pathNot: ["^src/main\\.ts$", "\\.d\\.ts$", "\\.spec\\.ts$"] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // tsconfig.json é do tipo "solution" e não inclui arquivo nenhum; apontar
    // para ele fazia o dependency-cruiser varrer zero módulos e passar em vazio.
    tsConfig: { fileName: "tsconfig.app.json" },
    tsPreCompilationDeps: true,
    // Imports do Angular omitem a extensão; sem esta lista o resolvedor deixa
    // as dependências sem resolver e as regras de camada nunca disparam.
    enhancedResolveOptions: { extensions: [".ts", ".js", ".json"] },
    exclude: { path: "\\.(test|spec)\\.ts$" },
  },
};
