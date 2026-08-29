import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// A API é servida pelo mesmo origin através deste proxy. Isso não é conveniência:
// o refresh token vive num cookie httpOnly host-only, que o navegador só devolve
// para a origem que o emitiu.
const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    proxy: { "/api": { target: apiTarget, changeOrigin: false } },
  },
  preview: {
    port: Number(process.env.PORT ?? 5173),
    proxy: { "/api": { target: apiTarget, changeOrigin: false } },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      // `app/` fica de fora de propósito: é composição — rotas, guardas e
      // páginas — e quem a verifica é o roteiro do Playwright, que roda o
      // mesmo caminho nos três SPAs. Medi-la aqui premiaria teste de fumaça
      // que monta a página e não afirma nada.
      include: ["src/{domain,data,features,ui}/**/*.{ts,tsx}"],
      exclude: ["src/data/api/schema.d.ts", "**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // A lógica é o que quebra. Aqui a barra é a mesma do backend.
        "src/domain/**": { lines: 90, functions: 90, branches: 90, statements: 90 },
        "src/data/**": { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  },
});
