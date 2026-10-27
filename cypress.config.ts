import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 12_000,
    pageLoadTimeout: 60_000,
    viewportWidth: 1280,
    viewportHeight: 800,
    retries: { runMode: 1, openMode: 0 },
  },
});
