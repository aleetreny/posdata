import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) =>
  JSON.parse(
    fs.readFileSync(new URL(`../public/data/${file}`, import.meta.url)),
  );
const data = read("datasets.json");

test("SED reproduces the published national totals and keeps the conditional denominator", () => {
  const d = data.find((x) => x.id === "sed");
  const r = d.records.find((x) => x.field === "All fields");
  assert.equal(r.total, 58131);
  assert.equal(r.committed, 36718);
  assert.equal(r.denominator, 33765);
  assert.deepEqual(r.values, [13296, 8098, 8266, 4105]);
  assert.equal(
    r.values.reduce((a, b) => a + b, 0),
    r.denominator,
  );
  assert.equal(
    d.records.filter((r) => r.broad && r.field !== "All fields").length,
    16,
  );
  for (const field of [
    "Humanities",
    "Visual and performing arts",
    "Education",
    "Business",
  ])
    assert.ok(d.records.find((r) => r.field === field));
});
test("SDR keeps survey weights and standard errors, and distinguishes duplicate hierarchy labels", () => {
  const d = data.find((x) => x.id === "sdr");
  const r = d.records[0];
  assert.equal(r.total, 908700);
  assert.deepEqual(r.values, [368100, 462250, 78350]);
  assert.deepEqual(r.se, [2450, 2800, 1450]);
  assert.equal(new Set(d.records.map((r) => r.field)).size, d.records.length);
  assert.equal(r.label.es, "Ciencias, ingeniería y salud");
  const aggregate = d.records.find(
    (r) => r.field === "Political science and government",
  );
  const subfield = d.records.find(
    (r) => r.field === "Political science and government (subfield)",
  );
  assert.equal(aggregate.salary, 116000);
  assert.equal(
    subfield.salary,
    null,
    "Do not impute aggregate income to a narrower subfield",
  );
  assert.equal(aggregate.unemployment, 1.1);
  assert.equal(subfield.unemployment, 0.8);
});
test("France keeps cohorts and horizons separate; unavailable data is not zero", () => {
  const d = data.find((x) => x.id === "france");
  assert.equal(d.records.length, 80);
  assert.deepEqual([...new Set(d.records.map((r) => r.year))].sort(), [
    "2014",
    "2016",
  ]);
  assert.equal(d.salaryPeriod, "month-net");
  assert.equal(d.unit, "percent");
  assert.equal(read("france-institutions.json").length, 1010);
  assert.ok(
    data
      .find((x) => x.id === "sed")
      .records.some((r) => r.values.includes(null)),
  );
});
test("LEO uses disjoint activity states and source-verified 5-year totals", () => {
  const d = data.find((x) => x.id === "leo");
  const r = d.records.find(
    (r) => r.field === "Total" && r.year === "202324" && r.horizon === "5",
  );
  assert.deepEqual(r.values, [79.4, 4.8, 0.6, 3.7, 11.5]);
  assert.equal(r.salary, 46500);
  for (const r of d.records) {
    for (const v of r.values)
      if (v !== null)
        assert.ok(v >= 0 && v <= 100, `${r.id}: invalid value ${v}`);
    if (r.values.every((v) => v !== null))
      assert.ok(
        Math.abs(r.values.reduce((a, b) => a + b, 0) - 100) < 0.3,
        `${r.id}: non-disjoint outcomes`,
      );
  }
});
test("source keys are unique and all tables exist, with suppression markers preserved", () => {
  for (const d of data) {
    const keys = d.records.map((r) => [r.field, r.year, r.horizon].join("|"));
    assert.equal(new Set(keys).size, keys.length, d.id);
  }
  const tables = read("tables.json");
  assert.equal(tables.length, 196);
  for (const table of tables) {
    const t = read(`tables/${table.id}.json`);
    assert.equal(t.rows.length, table.rows);
    assert.match(table.url, /^https:\/\/ncses\.nsf\.gov\//);
  }
  assert.ok(read("tables/nsf25349-tab006-001.json").rows.flat().includes("D"));
});
test("historical placements retain anonymous records and do not erase uncertain duplicates", () => {
  const p = read("placements.json");
  assert.equal(p.length, 6512);
  assert.equal(p.filter((r) => !r.name).length, 1739);
  assert.equal(p.filter((r) => !r.field).length, 4599);
  assert.equal(new Set(p.map((r) => r.id)).size, 6512);
  assert.equal(new Set(p.map((r) => r.institution)).size, 29);
  assert.equal(Math.min(...p.map((r) => r.year)), 1998);
  assert.equal(Math.max(...p.map((r) => r.year)), 2023);
});
test("all integrated sources retain provenance and explicit observation semantics", () => {
  for (const d of data) {
    assert.ok(d.url.startsWith("https://"));
    assert.ok(d.license);
    assert.ok(d.population.es && d.note.en);
    assert.ok(d.categories.length >= 3);
    for (const r of d.records)
      assert.equal(r.values.length, d.categories.length);
  }
  assert.equal(read("sources.json").length, 75);
  assert.ok(
    read("manifest.json").every((s) => s.sha256 && s.retrieved && s.url),
  );
});
