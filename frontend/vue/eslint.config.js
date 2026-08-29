import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

const typedRules = {
  complexity: ["error", 10],
};

export default tseslint.config(
  { ignores: ["dist", "coverage", "src/data/api/schema.d.ts"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  // TypeScript puro: parser do typescript-eslint.
  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: ["./tsconfig.json"], tsconfigRootDir: import.meta.dirname },
    },
    rules: typedRules,
  },

  // SFC: o parser tem de ser o do Vue, com o de TS por dentro. `strictTypeChecked`
  // define `languageOptions.parser`, então este bloco precisa vir depois dele e
  // reafirmar o parser — senão o ESLint tenta ler `<template>` como TypeScript.
  {
    files: ["**/*.vue"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      ...typedRules,
      "vue/multi-word-component-names": "off",
      // Formatação é do Prettier. Estas regras brigam com ele e produziriam
      // um lint que nunca fica verde depois de formatar.
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/attributes-order": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/multiline-html-element-content-newline": "off",
    },
  },

  { files: ["**/*.{js,cjs,mjs}"], languageOptions: { globals: { ...globals.node } } },

  {
    files: ["tests/**", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);
