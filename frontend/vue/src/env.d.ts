/// <reference types="vite/client" />

/**
 * Sem esta declaração, um arquivo `.ts` que importa um `.vue` recebe um tipo de
 * erro — o `vue-tsc` entende SFCs, mas o programa de TypeScript que o ESLint
 * monta, não.
 */
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
