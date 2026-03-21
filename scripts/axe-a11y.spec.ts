/**
 * Sprint 9-10 — Pruebas WCAG con axe-playwright
 * Ejecutar: npx playwright test scripts/axe-a11y.spec.ts
 * Requiere: @playwright/test, axe-playwright
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accesibilidad WCAG", () => {
  test("Página principal sin violaciones críticas", async ({ page }) => {
    await page.goto("http://localhost:3000");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("Login sin violaciones críticas", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
