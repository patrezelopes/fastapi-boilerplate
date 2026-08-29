import { defineConfig, devices } from "@playwright/test";

/**
 * Um roteiro só, para os três SPAs.
 *
 * `WEB_URL` aponta para o frontend em teste; o roteiro não sabe qual é, e não
 * deve saber. Se algum dia precisar saber, o comportamento divergiu — conserte
 * o SPA, não o teste.
 */
const webUrl = process.env["WEB_URL"] ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1,
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: webUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
