import js from "@eslint/js";
import angular from "angular-eslint";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", ".angular", "src/data/api/schema.d.ts"] },

  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: globals.browser,
      // O tsconfig.json da raiz é do tipo "solution": referencia app e spec, mas
      // não inclui arquivo nenhum. `projectService` deixa o typescript-eslint
      // descobrir o projeto certo para cada arquivo.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      complexity: ["error", 10],
      // Um componente de projeção de conteúdo é uma classe vazia por exigência
      // do Angular, não por descuido.
      "@typescript-eslint/no-extraneous-class": "off",
      // `Validators.required` e afins são métodos estáticos passados por
      // referência — é assim que Reactive Forms funciona.
      "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
    },
  },

  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },

  { files: ["**/*.{js,cjs,mjs}"], languageOptions: { globals: { ...globals.node } } },

  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
);
