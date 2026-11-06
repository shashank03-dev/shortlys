import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing page exposes the QR feature", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "QR codes that stay editable." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Create a QR code/i }).first()).toBeVisible();
});

test("QR page has the minimal generator", async ({ page }) => {
  await page.goto("/qr", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Turn a link into a QR code." })).toBeVisible();
  await expect(page.getByLabel("Destination URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create QR code" })).toBeVisible();
});

test("shorten page still renders", async ({ page }) => {
  await page.goto("/shorten", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Shorten Your Links/i })).toBeVisible();
});

for (const theme of ["dark", "light"]) {
  test(`QR page fits the viewport and is accessible in ${theme} mode`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} (${message.location().url})`); });
    await page.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
    await page.goto("/qr", { waitUntil: "domcontentloaded" });
    await page.locator("summary", { hasText: "Customize" }).click();
    await expect(page.getByLabel("Foreground")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact))).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`qr-${theme}.png`), fullPage: true });
  });
}

test("API reads and writes reject signed-out requests", async ({ request }) => {
  for (const path of ["/api/qr", "/api/user-urls", "/api/dashboard-data", "/api/analytics"]) {
    expect((await request.get(path)).status()).toBe(401);
  }
  expect((await request.post("/api/qr", { data: { mode: "new", url: "https://example.com" } })).status()).toBe(401);
});

for (const path of ["/", "/qr", "/shorten"]) {
  test(`axe has no serious issues on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1").locator("..")).toHaveCSS("opacity", "1");
    if (path === "/shorten") await expect(page.locator("form").locator("../..")).toHaveCSS("opacity", "1");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
    expect(serious).toEqual([]);
  });
}
