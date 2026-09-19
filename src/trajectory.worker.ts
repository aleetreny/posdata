/// <reference lib="webworker" />
import { fetchCompressed, fold } from "./trajectory-data";
import type {
  CareerResults,
  CareerRow,
  TrajectoryFilters,
  TrajectoryManifest,
} from "./trajectory-data";

type Row = [
  string,
  string,
  number,
  string,
  number,
  number,
  number,
  string,
  number,
  number,
  number,
  number,
  number,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
type Part = { orgs: string[]; roles: string[]; rows: Row[] };
type Ref = { row: Row; part: Part };
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let manifest: TrajectoryManifest;
let base = "";
let current = 0;
const loaded = new Map<string, Part>();
const pending = new Map<string, Promise<Part>>();
let lastKey = "";
let matches: Ref[] = [];
let aggregates: Omit<CareerResults, "rows" | "page" | "pages">;

function groups(origin: string) {
  return origin === "all"
    ? ["europe", "us", "other"]
    : origin === "europe" || manifest.europe.includes(origin)
      ? ["europe"]
      : origin === "US"
        ? ["us"]
        : ["other"];
}
async function load(file: string, sha256: string) {
  if (loaded.has(file)) return loaded.get(file)!;
  if (!pending.has(file)) {
    pending.set(
      file,
      fetchCompressed<Part>(base + file + "?v=" + sha256.slice(0, 16))
        .then((part) => {
          loaded.set(file, part);
          pending.delete(file);
          return part;
        })
        .catch((error) => {
          pending.delete(file);
          throw error;
        }),
    );
  }
  return pending.get(file)!;
}
function materialize(
  { row: r, part: p }: Ref,
  f: TrajectoryFilters,
): CareerRow {
  const k = f.mode === "first" ? 6 : 12;
  return {
    id: r[0],
    name: r[1],
    doctoralOrg: p.orgs[r[2]],
    doctoralCountry: r[3],
    doctoralYear: r[4],
    field: r[5],
    employer: p.orgs[r[k] as number],
    country: r[k + 1] as string,
    role: p.roles[r[k + 2] as number],
    jobYear: r[k + 3] as number,
    sector: r[k + 4] as number,
    roleGroup: r[k + 5] as number,
    detailShard: r[18],
    detailOffset: r[19],
    ambiguous: f.mode === "first" && !!r[20],
    jobCount: r[21],
  };
}
function aggregate(f: TrajectoryFilters) {
  const key = JSON.stringify({ ...f, page: 0 });
  if (key === lastKey) return;
  const sector = new Map<string, number>(),
    destinations = new Map<string, number>(),
    fields = new Map<string, number>(),
    origins = new Map<string, number>(),
    organisations = new Map<string, number>();
  const add = (map: Map<string, number>, value: string) =>
    map.set(value, (map.get(value) || 0) + 1);
  matches = [];
  let international = 0,
    missingCountry = 0,
    unknownSector = 0;
  const search = fold(f.q.trim()).split(/\s+/).filter(Boolean),
    k = f.mode === "first" ? 6 : 12;
  for (const shard of manifest.indexes.filter((s) =>
    groups(f.origin).includes(s.group!),
  )) {
    const part = loaded.get(shard.file)!;
    for (const r of part.rows) {
      if (f.origin !== "all" && f.origin !== "europe" && r[3] !== f.origin)
        continue;
      if (f.destination && r[k + 1] !== f.destination) continue;
      if (f.field && String(r[5]) !== f.field) continue;
      if (f.sector && String(r[k + 4]) !== f.sector) continue;
      if (f.employer && part.orgs[r[k] as number] !== f.employer) continue;
      if (f.role && String(r[k + 5]) !== f.role) continue;
      if (f.from && r[4] < Number(f.from)) continue;
      if (f.to && r[4] > Number(f.to)) continue;
      const moved = !!r[3] && !!r[k + 1] && r[3] !== r[k + 1];
      if (f.mobility === "international" && !moved) continue;
      if (f.mobility === "domestic" && (!r[3] || !r[k + 1] || moved)) continue;
      if (search.length) {
        const values = {
          person: `${r[0]} ${r[1]}`,
          doctoral: part.orgs[r[2]],
          employer: part.orgs[r[k] as number],
          role: part.roles[r[k + 2] as number],
        };
        const text = fold(
          f.searchIn in values
            ? values[f.searchIn as keyof typeof values]
            : Object.values(values).join(" "),
        );
        if (!search.every((word) => text.includes(word))) continue;
      }
      matches.push({ row: r, part });
      if (moved) international++;
      if (!r[k + 1]) missingCountry++;
      if (!r[k + 4]) unknownSector++;
      add(sector, String(r[k + 4]));
      add(destinations, (r[k + 1] as string) || "unknown");
      add(fields, String(r[5]));
      add(origins, r[3]);
      add(organisations, part.orgs[r[k] as number]);
    }
  }
  matches.sort(
    (a, b) => b.row[4] - a.row[4] || a.row[1].localeCompare(b.row[1]),
  );
  const sorted = (map: Map<string, number>): [string, number][] =>
    [...map].sort((a, b) => b[1] - a[1]);
  aggregates = {
    total: matches.length,
    international,
    missingCountry,
    unknownSector,
    sectors: sorted(sector),
    destinations: sorted(destinations),
    fields: sorted(fields),
    origins: sorted(origins),
    organisations: sorted(organisations),
  };
  lastKey = key;
}
async function query(
  id: number,
  f: TrajectoryFilters,
  exporting = false,
  lang: "es" | "en" = "es",
) {
  const files = manifest.indexes.filter((s) =>
    groups(f.origin).includes(s.group!),
  );
  let done = files.filter((s) => loaded.has(s.file)).length;
  ctx.postMessage({ type: "progress", id, done, total: files.length });
  const todo = files.filter((s) => !loaded.has(s.file));
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(3, todo.length) }, async () => {
      while (i < todo.length) {
        const file = todo[i++];
        await load(file.file, file.sha256);
        done++;
        ctx.postMessage({ type: "progress", id, done, total: files.length });
      }
    }),
  );
  if (id !== current) return;
  aggregate(f);
  if (exporting) {
    const quote = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+@\-]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const chunks = [
      "\uFEFF" +
        [
          "orcid",
          "name",
          "doctoral_institution",
          "doctoral_country",
          "doctoral_year",
          "field_rule",
          "employer",
          "employment_country",
          "role_reported",
          "job_start_year",
          "sector_ror",
          "function_rule",
          "observed_job_selection",
          "snapshot",
          "source",
        ].join(",") +
        "\r\n",
    ];
    for (const ref of matches) {
      const r = materialize(ref, f);
      chunks.push(
        [
          r.id,
          r.name,
          r.doctoralOrg,
          r.doctoralCountry,
          r.doctoralYear,
          manifest.fields[r.field][lang],
          r.employer,
          r.country,
          r.role,
          r.jobYear,
          manifest.sectors[r.sector][lang],
          manifest.functions[r.roleGroup][lang],
          f.mode,
          manifest.snapshot,
          `https://orcid.org/${r.id}`,
        ]
          .map(quote)
          .join(",") + "\r\n",
      );
    }
    ctx.postMessage({
      type: "export",
      id,
      blob: new Blob(chunks, { type: "text/csv;charset=utf-8" }),
      count: matches.length,
    });
    return;
  }
  const pages = Math.max(1, Math.ceil(matches.length / 25)),
    page = Math.max(1, Math.min(f.page, pages));
  ctx.postMessage({
    type: "result",
    id,
    result: {
      ...aggregates,
      pages,
      page,
      rows: matches
        .slice((page - 1) * 25, page * 25)
        .map((r) => materialize(r, f)),
    },
  });
}
ctx.onmessage = (event: MessageEvent) => {
  const m = event.data;
  if (m.type === "init") {
    manifest = m.manifest;
    base = m.base;
    return;
  }
  if (m.type === "query" || m.type === "export") {
    current = m.id;
    query(m.id, m.filters, m.type === "export", m.lang).catch((error) => {
      ctx.postMessage({ type: "error", id: m.id, message: String(error) });
    });
  }
};
