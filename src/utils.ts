import type { Dataset, Lang, Row } from "./types";
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const pct = (d: Dataset, r: Row, i: number) =>
  r.values[i] == null || !r.denominator
    ? null
    : (r.values[i]! / r.denominator) * 100;
export const number = (
  n: number | null | undefined,
  lang: Lang,
  decimals = 0,
) =>
  n == null
    ? "—"
    : new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(n);
export const yearLabel = (s: string) =>
  s.length === 6 ? s.slice(0, 4) + "/" + s.slice(4) : s;
export function download(
  name: string,
  contents: string,
  type = "text/csv;charset=utf-8",
) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (x: unknown) =>
    '"' +
    String(x ?? "")
      .replace(/^[=+@\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
    ].join("\r\n")
  );
}
export function exportRows(d: Dataset, rows: Row[], lang: Lang) {
  download(
    `posdata-${d.id}.csv`,
    csv(
      rows.map((r) => ({
        discipline: r.label[lang],
        year: r.year,
        horizon_years: r.horizon,
        population_n: r.total,
        denominator: r.denominator,
        ...Object.fromEntries(
          d.categories.map((c, i) => [c[lang], r.values[i]]),
        ),
        values_unit: d.unit,
        salary_median: r.salary,
        currency: d.currency,
        salary_period: d.salaryPeriod,
        source: d.url,
        population: d.population[lang],
        note: d.note[lang],
      })),
    ),
  );
}
