import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:5173/";
const out = ".impeccable/review";
await fs.mkdir(out, { recursive: true });
await fs.mkdir("test-results", { recursive: true });
const report = {
  started: new Date().toISOString(),
  base,
  views: [],
  interactions: [],
  errors: [],
  accessibility: [],
  geometry: [],
};
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
const go = async (view = "atlas", extra = "") => {
  await page.goto(`${base}?view=${view}${extra}`, { waitUntil: "networkidle" });
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const record = (name) => {
  report.interactions.push(name);
  console.log("PASS", name);
};
const geometry = async (label) => {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    body: document.documentElement.scrollWidth,
    brokenImages: [...document.images]
      .filter((i) => !i.complete || !i.naturalWidth)
      .map((i) => i.src),
    overlay: !!document.querySelector("vite-error-overlay"),
    emptyButtons: [...document.querySelectorAll("button")].filter(
      (x) => !x.textContent.trim() && !x.getAttribute("aria-label"),
    ).length,
  }));
  report.geometry.push({ label, ...result });
  assert.ok(
    result.body <= result.width + 1,
    `${label}: horizontal body overflow ${result.body}/${result.width}`,
  );
  assert.equal(result.brokenImages.length, 0);
  assert.equal(result.overlay, false);
  assert.equal(result.emptyButtons, 0);
  const activeVisible = await page.evaluate(() => {
    const nav = document.querySelector('.masthead nav');
    const active = nav?.querySelector('[aria-current="page"]');
    if (!active) return true;
    const n = nav.getBoundingClientRect(), a = active.getBoundingClientRect();
    return a.left >= n.left - 1 && a.right <= n.right + 1;
  });
  assert.equal(activeVisible, true, `${label}: active navigation item is clipped`);
};
const screenshot = async (name, fullPage = true) =>
  page.screenshot({
    path: `${out}/${name}.png`,
    fullPage,
    animations: "disabled",
  });

try {
  await go();
  await page.getByRole("link", { name: "Estudios", exact: true }).click();
  await page
    .getByRole("heading", { name: "La evidencia detrás del mapa." })
    .waitFor();
  await page.goBack();
  await page
    .getByRole("heading", { name: "Tu doctorado. Muchos destinos." })
    .waitFor();
  record("browser history back after in-app navigation");
  const failureContext = await browser.newContext();
  const failurePage = await failureContext.newPage();
  await failurePage.route("**/data/datasets.json", (r) => r.abort());
  await failurePage.goto(`${base}?view=atlas`);
  await failurePage.getByRole("alert").waitFor();
  await failurePage.unroute("**/data/datasets.json");
  await failurePage.getByRole("button", { name: "Volver a intentar" }).click();
  await failurePage
    .getByRole("heading", { name: "Tu doctorado. Muchos destinos." })
    .waitFor();
  await failureContext.close();
  record("failed data request and retry recovery");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const view of [
      "atlas",
      "compare",
      "placements",
      "careers",
      "studies",
      "sources",
      "tables",
      "methods",
    ]) {
      await go(view);
      await geometry(`${view}-${width}`);
      await screenshot(`${view}-${width}`);
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.accessibility.push({
        view,
        width,
        violations: a.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
      report.views.push({
        view,
        width,
        buttons: await page.locator("button").count(),
      });
      console.log("VIEW", view, width);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go();
  await screenshot("desktop");
  await page.getByRole("button", { name: "Humanidades", exact: true }).click();
  assert.match(
    await page.locator(".results-heading h2").innerText(),
    /Humanidades/,
  );
  await page.getByRole("button", { name: "Mostrar también subcampos" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar disciplina" })
    .fill("Historia");
  await page.getByRole("button", { name: "Historia", exact: true }).click();
  assert.match(page.url(), /History/);
  record("discipline, subfields, accent-insensitive search and URL");
  for (let i = 0; i < 4; i++) {
    await page.locator(".destination").nth(i).click();
    assert.equal(await page.locator(".destination-detail").count(), 1);
    await page.getByRole("button", { name: "Cerrar detalle" }).click();
  }
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  assert.equal(await page.locator(".atlas-results tbody tr").count(), 4);
  await page.getByRole("button", { name: "Mapa", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar esta selección" }).click();
  const download = await dl;
  assert.match(download.suggestedFilename(), /sed.*csv/);
  record("all destination details, map/table switch, filtered CSV");
  await page.getByRole("button", { name: "Compartir esta vista" }).click();
  await page.getByRole("status").filter({ hasText: "Enlace" }).waitFor();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    page.url(),
  );
  record("share current state");
  for (const dataset of ["sdr", "france", "leo"]) {
    await page
      .getByRole("combobox", { name: "Fuente de datos", exact: true })
      .selectOption(dataset);
    await geometry(dataset);
    assert.equal(
      await page.locator(".destination").count(),
      dataset === "sdr" ? 3 : dataset === "france" ? 4 : 5,
    );
    if (dataset === "france") {
      await page
        .getByRole("combobox", { name: "Año del dato", exact: true })
        .selectOption("2014");
      await page
        .getByRole("combobox", { name: "Años desde el doctorado" })
        .selectOption("1");
    }
    if (dataset === "leo") {
      for (const year of ["201718", "202324"])
        await page
          .getByRole("combobox", { name: "Año del dato", exact: true })
          .selectOption(year);
      for (const horizon of ["1", "3", "10", "5"])
        await page
          .getByRole("combobox", { name: "Años desde el doctorado" })
          .selectOption(horizon);
    }
    await screenshot(`atlas-${dataset}-desktop`);
  }
  record("all data sources, cohort and horizon controls");
  await page.getByRole("button", { name: "Switch to English" }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.match(await page.locator("h1").innerText(), /Your doctorate/);
  await page.getByRole("button", { name: "Cambiar a español" }).click();
  record("language switch");
  await go("compare");
  await page.getByRole("button", { name: "Limpiar selección" }).click();
  assert.equal(await page.locator(".empty").count(), 1);
  const checks = page.locator(".compare-choices input");
  for (let i = 0; i < 4; i++) await checks.nth(i).check();
  assert.equal(await checks.nth(4).isDisabled(), true);
  const compareURL = page.url();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".compare-choices input:checked").count(), 4);
  assert.equal(page.url(), compareURL);
  await checks.nth(0).uncheck();
  assert.equal(await checks.nth(4).isDisabled(), false);
  record("comparison limit, empty state and shareable selection");
  await go("placements");
  await page
    .getByRole("searchbox", { name: "Buscar destinos" })
    .fill("World Bank");
  assert.ok((await page.locator("tbody tr").count()) > 0);
  await page.locator("#placement-inst").selectOption("harvard");
  await page.locator("#placement-type").selectOption("international_org");
  await page.locator("#placement-year").selectOption("2021");
  await page.getByRole("button", { name: "Restablecer", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 25);
  const first = await page.locator("tbody tr").first().innerText();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  assert.notEqual(await page.locator("tbody tr").first().innerText(), first);
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  assert.equal(await page.locator("tbody tr").first().innerText(), first);
  await page
    .getByRole("searchbox", { name: "Buscar destinos" })
    .fill("zzzz-no-record");
  assert.equal(await page.locator(".empty").count(), 1);
  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  record(
    "placements search, department/type/year filters, pagination and empty reset",
  );
  await go("careers");
  const saves = page.locator(".save-button");
  for (let i = 0; i < (await saves.count()); i++) {
    await saves.nth(i).click();
    assert.equal(await saves.nth(i).getAttribute("aria-pressed"), "true");
    await saves.nth(i).click();
  }
  await saves.first().click();
  await page.getByRole("button", { name: /Mi selección/ }).click();
  assert.equal(await page.locator(".career-list article").count(), 1);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".save-button.saved").count(), 1);
  await page
    .getByRole("button", { name: "Guardar lista", exact: true })
    .click();
  for (const b of await page.locator(".filter-tabs button").all())
    await b.click();
  await page
    .getByRole("button", { name: "Todas las funciones", exact: true })
    .click();
  record("all 18 shortlists, persistence, export, career filters");
  await go("studies");
  for (const el of await page.locator(".studies-list summary").all()) {
    await el.click();
    await el.click();
  }
  await page
    .getByRole("searchbox", { name: "Buscar estudios" })
    .fill("Hancock");
  assert.equal(await page.locator(".studies-list article").count(), 1);
  await page.getByRole("button", { name: "BibTeX" }).click();
  await page.getByRole("button", { name: "Borrar búsqueda" }).click();
  await page.locator("#study-topic").selectOption("Humanidades");
  assert.equal(await page.locator(".studies-list article").count(), 3);
  record("all study disclosures, search, topic, BibTeX");
  await go("sources");
  for (const el of await page.locator(".sources-list summary").all()) {
    await el.click();
    await el.click();
  }
  await page.getByRole("searchbox", { name: "Buscar fuentes" }).fill("ORCID");
  assert.ok((await page.locator(".sources-list details").count()) > 0);
  await page.getByRole("button", { name: "Borrar búsqueda" }).click();
  await page.locator("#priority").selectOption("A");
  assert.ok((await page.locator(".sources-list details").count()) > 0);
  record("all 75 source disclosures, search and priority");
  await go("tables");
  let tablesTested = 0;
  for (let n = 0; n < 10; n++) {
    const count = await page.locator(".table-directory h2 button").count();
    for (let i = 0; i < count; i++) {
      await page.locator(".table-directory h2 button").nth(i).click();
      await page.locator(".original-table tr").first().waitFor();
      assert.ok((await page.locator(".original-table tr").count()) > 0);
      await page.getByRole("button", { name: "Volver a las tablas" }).click();
      tablesTested++;
    }
    if (n < 9)
      await page
        .getByRole("button", { name: "Siguiente", exact: true })
        .click();
  }
  assert.equal(tablesTested, 196);
  record("all 196 table-opening buttons and return navigation");
  await page.getByRole("button", { name: "Universidades francesas" }).click();
  await page.locator("tbody tr").first().waitFor();
  await page
    .getByRole("searchbox", { name: "Buscar universidad francesa" })
    .fill("Lyon");
  assert.ok((await page.locator("tbody tr").count()) > 0);
  await page.locator(".filter-bar select").nth(0).selectOption("2014");
  await page.locator(".filter-bar select").nth(1).selectOption("12");
  record("French institutional table, search, cohort and horizon");
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const v of [
      "atlas",
      "compare",
      "placements",
      "careers",
      "studies",
      "sources",
      "tables",
      "methods",
    ]) {
      await go(v);
      await geometry(`${v}-${width}`);
    }
  }
  record("all routes at 320, 375, 768 and 1280 without body overflow");
  await page.setViewportSize({ width: 390, height: 844 });
  await go();
  await screenshot("mobile");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => document.activeElement !== document.body),
  );
  record("keyboard focus available");
  await context.close();
  await browser.close();
  const wk = await webkit.launch();
  const wc = await wk.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const wp = await wc.newPage();
  wp.on("pageerror", (e) => report.errors.push("webkit " + e.message));
  for (const v of [
    "atlas",
    "compare",
    "placements",
    "careers",
    "studies",
    "sources",
    "tables",
    "methods",
  ]) {
    await wp.goto(`${base}?view=${v}`, { waitUntil: "networkidle" });
    await wp.locator("main h1").waitFor();
    assert.ok(
      await wp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `WebKit ${v} overflow`,
    );
  }
  await wp.goto(`${base}?view=atlas`);
  await wp
    .getByRole("combobox", { name: "Fuente de datos", exact: true })
    .selectOption("france");
  assert.equal(await wp.locator(".destination").count(), 4);
  await wp.screenshot({ path: `${out}/webkit-mobile.png`, fullPage: true });
  await wk.close();
  record("WebKit mobile navigation and native source selector");
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  console.error(error);
  await page
    .screenshot({ path: "test-results/failure.png", fullPage: true })
    .catch(() => {});
  await browser.close().catch(() => {});
  process.exitCode = 1;
}
await fs.writeFile(
  "test-results/browser-report.json",
  JSON.stringify(report, null, 2),
);
if (report.errors.length) {
  console.error("Browser errors", report.errors);
  process.exitCode = 1;
}
const violations = report.accessibility.filter((a) => a.violations.length);
if (violations.length) {
  console.error("Accessibility issues", JSON.stringify(violations, null, 2));
  process.exitCode = 1;
}
console.log(
  JSON.stringify({
    passed: report.passed,
    interactions: report.interactions.length,
    views: report.views.length,
    geometry: report.geometry.length,
    errors: report.errors.length,
    accessibilityFailures: violations.length,
  }),
);
