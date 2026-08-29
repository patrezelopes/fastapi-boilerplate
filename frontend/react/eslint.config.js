import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src/data/api/schema.d.ts"] },
  js.configs.recommended,

  // As regras com informação de tipo valem só para o que está no tsconfig.
  // Aplicá-las aos arquivos de configuração em JS quebra o ESLint.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: ["./tsconfig.json"], tsconfigRootDir: import.meta.dirname },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      complexity: ["error", 10],
    },
  },

  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    files: ["tests/**", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);
