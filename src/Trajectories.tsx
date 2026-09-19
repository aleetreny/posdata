import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Download,
  Globe2,
  Search,
  Share2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Lang } from "./types";
import { defaultFilters, fetchCompressed, fold } from "./trajectory-data";
import type {
  Affiliation,
  CareerDetail,
  CareerResults,
  CareerRow,
  Label,
  TrajectoryFilters,
  TrajectoryManifest,
  UniversityData,
} from "./trajectory-data";

const base = `${import.meta.env.BASE_URL}data/trajectories/`;
const filterKeys = Object.keys(defaultFilters) as (keyof TrajectoryFilters)[];
const parameter = (key: string) => `tr${key[0].toUpperCase()}${key.slice(1)}`;
function readFilters(): TrajectoryFilters {
  const p = new URLSearchParams(location.search),
    f = { ...defaultFilters };
  for (const key of filterKeys) {
    const value = p.get(parameter(key));
    if (value === null) continue;
    if (key === "page") f.page = Math.max(1, Number(value) || 1);
    else if (key === "mode") f.mode = value === "first" ? "first" : "last";
    else f[key] = value;
  }
  return f;
}
const detailsCache = new Map<string, CareerDetail[]>();
const number = (value: number, lang: Lang) =>
  new Intl.NumberFormat(lang).format(value);
const percent = (value: number, total: number, lang: Lang) =>
  new Intl.NumberFormat(lang, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(total ? value / total : 0);
function countryName(code: string, lang: Lang) {
  if (!/^[A-Z]{2}$/.test(code))
    return lang === "es" ? "País sin indicar" : "Country not stated";
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
function dateLabel(date: number[] | null, lang: Lang) {
  if (!date) return lang === "es" ? "sin fecha" : "undated";
  if (!date[1]) return String(date[0]);
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    ...(date[2] ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date[0], date[1] - 1, date[2] || 1)));
}

function classificationLabel(method: string, lang: Lang) {
  const labels: Record<string, [string, string]> = {
    "ror-id": ["identificador ROR", "ROR identifier"],
    "grid-id": ["identificador GRID", "GRID identifier"],
    "exact-name-country": ["nombre y país exactos", "exact name and country"],
    "normalised-name-country": [
      "nombre y país; puntuación normalizada",
      "name and country; normalised punctuation",
    ],
    "unique-acronym-country": [
      "sigla única en ese país",
      "unique acronym in that country",
    ],
    "university-unit": [
      "unidad de la universidad indicada",
      "unit of the named university",
    ],
    "education-name": [
      "universidad explícita en el nombre; identidad sin resolver",
      "university explicitly named; identity unresolved",
    ],
    "education-name-id-conflict": [
      "universidad explícita; identificador contradictorio",
      "university explicitly named; conflicting identifier",
    ],
    "name-id-conflict": [
      "nombre y país; identificador de origen corregido",
      "name and country; source identifier corrected",
    ],
    "ambiguous-name": [
      "nombre ambiguo; sector sin resolver",
      "ambiguous name; sector unresolved",
    ],
  };
  return (
    labels[method]?.[lang === "es" ? 0 : 1] ||
    (lang === "es"
      ? "evidencia insuficiente para clasificar"
      : "insufficient evidence to classify")
  );
}

export default function Trajectories({
  lang: l,
  navigate,
}: {
  lang: Lang;
  navigate: (view: "methods" | "atlas" | "sources") => void;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [manifest, setManifest] = useState<TrajectoryManifest | null>(null);
  const [filters, setFilters] = useState(readFilters);
  const [results, setResults] = useState<CareerResults | null>(null);
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false),
    [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null),
    seq = useRef(0);
  useEffect(() => {
    if (manifest) return;
    const controller = new AbortController();
    setError(false);
    fetch(base + "manifest.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setManifest)
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(true);
          setBusy(false);
        }
      });
    return () => controller.abort();
  }, [manifest, retry]);
  useEffect(() => {
    const back = () => {
      setFilters(readFilters());
      setExpanded(null);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    if (!manifest) return;
    const w = new Worker(new URL("./trajectory.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.postMessage({
      type: "init",
      manifest,
      base: new URL(base, location.href).href,
    });
    w.onmessage = (e) => {
      const m = e.data;
      if (m.id !== seq.current) return;
      if (m.type === "progress") setProgress({ done: m.done, total: m.total });
      if (m.type === "result") {
        setResults(m.result);
        setBusy(false);
        setExporting(false);
      }
      if (m.type === "error") {
        setError(true);
        setBusy(false);
        setExporting(false);
      }
      if (m.type === "export") {
        const url = URL.createObjectURL(m.blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "posdata-orcid-trayectorias.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setExporting(false);
      }
    };
    w.onerror = () => {
      setError(true);
      setBusy(false);
      setExporting(false);
    };
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, [manifest, retry]);
  useEffect(() => {
    if (!manifest || !worker.current) return;
    const id = ++seq.current;
    setBusy(true);
    setError(false);
    setExporting(false);
    const timer = setTimeout(
      () => worker.current?.postMessage({ type: "query", id, filters }),
      180,
    );
    return () => clearTimeout(timer);
  }, [manifest, filters, retry]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const change = (patch: Partial<TrajectoryFilters>) => {
    const next = { ...filters, page: 1, ...patch };
    setFilters(next);
    setExpanded(null);
    const p = new URLSearchParams(location.search);
    p.set("view", "trajectories");
    for (const key of filterKeys) {
      if (next[key] === defaultFilters[key]) p.delete(parameter(key));
      else p.set(parameter(key), String(next[key]));
    }
    history.replaceState(null, "", `${location.pathname}?${p}`);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setMessage(
        t("Enlace con tus filtros copiado.", "Link with your filters copied."),
      );
    } catch {
      setMessage(
        t(
          "Copia el enlace de la barra de direcciones.",
          "Copy the link from the address bar.",
        ),
      );
    }
  };
  const download = () => {
    if (!worker.current) return;
    setExporting(true);
    worker.current.postMessage({
      type: "export",
      id: ++seq.current,
      filters,
      lang: l,
    });
  };
  const countries = manifest
    ? Array.from(
        new Set([
          ...Object.keys(manifest.doctoralCountries),
          ...Object.keys(manifest.employmentCountries || {}),
        ]),
      )
        .filter((c) => /^[A-Z]{2}$/.test(c))
        .sort((a, b) => countryName(a, l).localeCompare(countryName(b, l)))
    : [];
  const selectedCount = Object.entries(filters).filter(
    ([k, v]) =>
      k !== "page" && v !== defaultFilters[k as keyof TrajectoryFilters],
  ).length;
  const options = (labels: Label[], all: string) => (
    <>
      <option value="">{all}</option>
      {labels.map((v, i) => (
        <option key={v.id} value={i}>
          {v[l]}
        </option>
      ))}
    </>
  );
  return (
    <>
      <div className="trajectory-intro">
        <div>
          <h1>
            {t("¿Dónde lleva un doctorado?", "Where does a doctorate lead?")}
          </h1>
          <p>
            {t(
              "Busca ejemplos de personas, universidades y empresas por disciplina. Empieza con doctorados de Europa o amplía la búsqueda a todo el mundo.",
              "Find people, universities and companies by discipline. Start with European doctorates or expand your search worldwide.",
            )}
          </p>
        </div>
        <button
          className="text-link trajectory-statistics-link"
          onClick={() => navigate("atlas")}
        >
          {t(
            "¿Buscas porcentajes y salarios?",
            "Looking for percentages and salaries?",
          )}{" "}
          {t("Ver estadísticas", "View statistics")} <ArrowRight size={17} />
        </button>
      </div>
      <div className="trajectory-mobile-jump" aria-live="polite">
        {busy || !results ? (
          <span>{t("Preparando trayectorias…", "Preparing careers…")}</span>
        ) : (
          <a href="#career-results-title">
            <strong>
              {number(results.total, l)} {t("trayectorias", "careers")}
            </strong>
            <span>
              {t("Ver trayectorias", "View careers")}
              <ArrowRight size={16} />
            </span>
          </a>
        )}
      </div>
      <div className="trajectory-edition">
        <span>
          <Globe2 size={16} />
          {manifest
            ? t(
                `${number(manifest.counts.profiles, l)} perfiles ORCID · archivo de octubre de 2025`,
                `${number(manifest.counts.profiles, l)} ORCID profiles · October 2025 archive`,
              )
            : t("Cargando la edición de datos…", "Loading the data edition…")}
        </span>
        <button
          onClick={() =>
            document
              .getElementById("trajectory-method")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          {t("Cobertura y límites", "Coverage & limitations")}{" "}
          <ArrowRight size={15} />
        </button>
      </div>
      {manifest && !manifest.complete && (
        <p className="preview-notice" role="status">
          {t(
            "Vista de desarrollo: extracción aún incompleta. Estas cifras no son la edición publicada.",
            "Development preview: extraction is incomplete. These counts are not the published edition.",
          )}
        </p>
      )}
      <section
        className="trajectory-controls"
        aria-label={t("Filtrar trayectorias", "Filter careers")}
      >
        <div className="trajectory-primary-filters">
          <label>
            {t("Disciplina del doctorado", "Doctoral discipline")}
            <select
              value={filters.field}
              onChange={(e) => change({ field: e.target.value })}
              disabled={!manifest}
            >
              {manifest &&
                options(
                  manifest.fields,
                  t("Todas las disciplinas", "All disciplines"),
                )}
            </select>
          </label>
          <label>
            {t("Sector del empleador", "Employer sector")}
            <select
              value={filters.sector}
              onChange={(e) => change({ sector: e.target.value })}
              disabled={!manifest}
            >
              {manifest &&
                options(
                  manifest.sectors,
                  t("Todos los sectores", "All sectors"),
                )}
            </select>
          </label>
          <div className="trajectory-search-group">
            <label className="trajectory-search-scope">
              {t("Buscar en", "Search in")}
              <select
                value={filters.searchIn}
                onChange={(e) => change({ searchIn: e.target.value })}
              >
                <option value="all">
                  {t("Todos los campos", "All fields")}
                </option>
                <option value="doctoral">
                  {t("Universidad del doctorado", "Doctoral university")}
                </option>
                <option value="employer">{t("Empleador", "Employer")}</option>
                <option value="person">{t("Persona", "Person")}</option>
                <option value="role">{t("Puesto", "Job title")}</option>
              </select>
            </label>
            <label className="trajectory-search">
              <span className="sr-only">
                {t(
                  "Persona, universidad, empresa o puesto",
                  "Person, university, company or role",
                )}
              </span>
              <span>
                <Search size={18} />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(e) => change({ q: e.target.value })}
                  placeholder={t(
                    "Por ejemplo: Oxford, engineer, Siemens…",
                    "For example: Oxford, engineer, Siemens…",
                  )}
                />
              </span>
            </label>
          </div>
        </div>
        <p className="trajectory-sector-help">
          {t(
            "El sector describe al empleador: las universidades públicas y privadas pertenecen a «Universidades y educación».",
            "Sector describes the employer: public and private universities both belong to ‘Universities & education’.",
          )}
        </p>
        <details className="trajectory-more-filters">
          <summary>
            <SlidersHorizontal size={17} />
            {t(
              "Origen, destino y más filtros",
              "Origin, destination & more filters",
            )}
            <span>
              {selectedCount
                ? `${selectedCount} ${t("activos", "active")}`
                : t(
                    "Doctorados en Europa · cualquier destino",
                    "European doctorates · any destination",
                  )}
            </span>
            <ChevronDown size={17} />
          </summary>
          <div className="trajectory-filter-grid">
            <label>
              {t("Doctorado en", "Doctorate in")}
              <select
                value={filters.origin}
                onChange={(e) => change({ origin: e.target.value })}
              >
                <option value="europe">
                  {t("Europa (todos sus países)", "Europe (all countries)")}
                </option>
                <option value="all">{t("Todo el mundo", "Worldwide")}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c, l)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Empleo en", "Employment in")}
              <select
                value={filters.destination}
                onChange={(e) => change({ destination: e.target.value })}
              >
                <option value="">{t("Cualquier país", "Any country")}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c, l)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Función del puesto", "Job function")}
              <select
                value={filters.role}
                onChange={(e) => change({ role: e.target.value })}
              >
                {manifest &&
                  options(
                    manifest.functions,
                    t("Todas las funciones", "All functions"),
                  )}
              </select>
            </label>
            <label>
              {t("Movilidad entre países", "Cross-country mobility")}
              <select
                value={filters.mobility}
                onChange={(e) => change({ mobility: e.target.value })}
              >
                <option value="">
                  {t("Todas las trayectorias", "All careers")}
                </option>
                <option value="international">
                  {t(
                    "País de empleo diferente",
                    "Different employment country",
                  )}
                </option>
                <option value="domestic">
                  {t(
                    "Mismo país que el doctorado",
                    "Same country as doctorate",
                  )}
                </option>
              </select>
            </label>
            <div className="trajectory-year-range">
              <label>
                {t("Doctorado desde", "Doctorate from")}
                <input
                  type="number"
                  min="1900"
                  max="2025"
                  inputMode="numeric"
                  value={filters.from}
                  onChange={(e) => change({ from: e.target.value })}
                  placeholder="1900"
                />
              </label>
              <label>
                {t("Hasta", "To")}
                <input
                  type="number"
                  min="1900"
                  max="2025"
                  inputMode="numeric"
                  value={filters.to}
                  onChange={(e) => change({ to: e.target.value })}
                  placeholder="2025"
                />
              </label>
            </div>
          </div>
        </details>
        <div className="trajectory-filter-footer">
          <div
            className="trajectory-scope"
            aria-label={t("Origen de los doctorados", "Doctoral origins")}
          >
            <button
              aria-pressed={filters.origin === "europe"}
              onClick={() => change({ origin: "europe" })}
            >
              {t("Desde Europa", "From Europe")}
            </button>
            <button
              aria-pressed={filters.origin === "all"}
              onClick={() => change({ origin: "all" })}
            >
              {t("Todo el mundo", "Worldwide")}
            </button>
            {!["europe", "all"].includes(filters.origin) && (
              <span>{countryName(filters.origin, l)}</span>
            )}
          </div>
          {selectedCount > 0 && (
            <button
              className="text-link reset-filters"
              onClick={() => change({ ...defaultFilters })}
            >
              <X size={15} />
              {t("Restablecer", "Reset")}
            </button>
          )}
        </div>
        {manifest &&
          (filters.employer ||
            filters.destination ||
            filters.role ||
            filters.mobility ||
            filters.from ||
            filters.to) && (
            <div
              className="trajectory-filter-chips"
              aria-label={t("Filtros aplicados", "Applied filters")}
            >
              {(
                [
                  ["employer", filters.employer],
                  [
                    "destination",
                    filters.destination
                      ? t("Empleo en ", "Job in ") +
                        countryName(filters.destination, l)
                      : "",
                  ],
                  ["role", manifest.functions[Number(filters.role)]?.[l]],
                  [
                    "mobility",
                    filters.mobility === "international"
                      ? t("Otro país", "Another country")
                      : t("Mismo país", "Same country"),
                  ],
                  ["from", t("Desde ", "From ") + filters.from],
                  ["to", t("Hasta ", "To ") + filters.to],
                ] as const
              )
                .filter(([key]) => filters[key])
                .map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => change({ [key]: "" })}
                    aria-label={`${t("Quitar filtro", "Remove filter")}: ${label}`}
                  >
                    {label}
                    <X size={14} />
                  </button>
                ))}
            </div>
          )}
      </section>
      {error ? (
        <div className="trajectory-status" role="alert">
          <h2>
            {t(
              "No se han podido cargar las trayectorias.",
              "The career records could not be loaded.",
            )}
          </h2>
          <p>
            {t(
              "Comprueba la conexión y vuelve a intentarlo. Tus filtros se conservan.",
              "Check your connection and try again. Your filters are preserved.",
            )}
          </p>
          <button className="button" onClick={() => setRetry((x) => x + 1)}>
            {t("Volver a intentar", "Try again")}
          </button>
        </div>
      ) : busy ? (
        <div className="trajectory-status" role="status">
          <h2>
            {t("Preparando las trayectorias…", "Preparing the career records…")}
          </h2>
          <p>
            {t(
              "La primera carga descarga solo la cobertura que has elegido. Los filtros se calculan en tu dispositivo.",
              "The first load downloads only your selected coverage. Filters are computed on your device.",
            )}
          </p>
          {progress.total > 0 && (
            <>
              <progress
                value={progress.done}
                max={progress.total}
                aria-label={t("Archivos cargados", "Files loaded")}
              />
              <span>
                {progress.done} / {progress.total}
              </span>
            </>
          )}
        </div>
      ) : (
        results &&
        manifest && (
          <div className="trajectory-workspace">
            <section
              className="trajectory-results"
              aria-labelledby="career-results-title"
            >
              <div className="trajectory-results-heading">
                <div>
                  <h2 id="career-results-title" tabIndex={-1}>
                    {number(results.total, l)} {t("trayectorias", "careers")}
                  </h2>
                  <p>
                    {t(
                      "Una por perfil ORCID. Doctorados más recientes primero.",
                      "One per ORCID profile. Most recent doctorates first.",
                    )}
                  </p>
                </div>
                <div className="trajectory-actions">
                  <button
                    onClick={share}
                    aria-label={t("Compartir filtros", "Share filters")}
                    title={t("Compartir filtros", "Share filters")}
                  >
                    <Share2 size={19} />
                  </button>
                  <button
                    disabled={exporting || !results.total}
                    onClick={download}
                  >
                    <Download size={17} />
                    {exporting ? t("Preparando…", "Preparing…") : "CSV"}
                  </button>
                </div>
              </div>
              <p className="trajectory-active-context">
                {filters.origin === "europe"
                  ? t("Doctorados en Europa", "Doctorates in Europe")
                  : filters.origin === "all"
                    ? t("Doctorados de todo el mundo", "Doctorates worldwide")
                    : countryName(filters.origin, l)}{" "}
                <ArrowRight size={15} />{" "}
                {filters.destination
                  ? countryName(filters.destination, l)
                  : t("Empleos en cualquier país", "Jobs in any country")}
              </p>
              <div className="trajectory-mode-row">
                <label>
                  {t("Puesto que se muestra", "Job shown")}
                  <select
                    value={filters.mode}
                    onChange={(e) =>
                      change({ mode: e.target.value as "first" | "last" })
                    }
                  >
                    <option value="last">
                      {t(
                        "Último inicio de empleo registrado",
                        "Latest recorded job start",
                      )}
                    </option>
                    <option value="first">
                      {t(
                        "Primer empleo posterior observado",
                        "First observed later job",
                      )}
                    </option>
                  </select>
                </label>
                <p>
                  {t(
                    "El último registro puede estar desactualizado. No equivale a empleo actual.",
                    "The latest record may be outdated. It does not establish current employment.",
                  )}
                </p>
              </div>
              <CareerDistributions
                results={results}
                manifest={manifest}
                lang={l}
                change={change}
                inline
              />
              {!results.total ? (
                <div className="trajectory-empty">
                  <h3>
                    {t(
                      "No hay registros con esta combinación.",
                      "No records match this combination.",
                    )}
                  </h3>
                  <p>
                    {t(
                      "Eso no significa que esa trayectoria no exista. Prueba a ampliar la disciplina, el origen o las fechas.",
                      "That does not mean this career path does not exist. Try a broader discipline, origin or date range.",
                    )}
                  </p>
                  <button
                    className="button"
                    onClick={() => change({ ...defaultFilters })}
                  >
                    {t(
                      "Ver todos los doctorados de Europa",
                      "See all European doctorates",
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="trajectory-column-head" aria-hidden="true">
                    <span>{t("Doctorado", "Doctorate")}</span>
                    <span>{t("Empleo declarado", "Reported employment")}</span>
                    <span>{t("Evidencia", "Evidence")}</span>
                  </div>
                  <div className="trajectory-records">
                    {results.rows.map((r) => (
                      <article
                        key={r.id}
                        className={`trajectory-record ${expanded === r.id ? "is-expanded" : ""}`}
                      >
                        <div className="trajectory-record-main">
                          <div className="trajectory-origin">
                            <h3>{r.name || `ORCID ${r.id}`}</h3>
                            <p>{r.doctoralOrg}</p>
                            <span>
                              {countryName(r.doctoralCountry, l)} ·{" "}
                              {r.doctoralYear}
                            </span>
                            <small>{manifest.fields[r.field][l]}</small>
                          </div>
                          <div className="trajectory-destination">
                            <ArrowRight
                              className="trajectory-route-arrow"
                              size={20}
                            />
                            <strong>{r.employer}</strong>
                            <p>
                              {r.role ||
                                t("Puesto no indicado", "Role not stated")}
                            </p>
                            <span>
                              {countryName(r.country, l)} ·{" "}
                              {t("inicio", "start")} {r.jobYear}
                            </span>
                            <small>{manifest.sectors[r.sector][l]}</small>
                          </div>
                          <button
                            className="trajectory-detail-toggle"
                            aria-expanded={expanded === r.id}
                            onClick={() =>
                              setExpanded(expanded === r.id ? null : r.id)
                            }
                          >
                            {t("Trayectoria", "Career record")}{" "}
                            {expanded === r.id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            <small>
                              {r.jobCount}{" "}
                              {r.jobCount === 1
                                ? t("puesto", "role")
                                : t("puestos", "roles")}
                            </small>
                          </button>
                        </div>
                        {expanded === r.id && (
                          <CareerEvidence
                            row={r}
                            manifest={manifest}
                            lang={l}
                          />
                        )}
                      </article>
                    ))}
                  </div>
                  <div className="trajectory-pagination">
                    <button
                      disabled={results.page <= 1}
                      onClick={() => {
                        change({ page: results.page - 1 });
                        document
                          .getElementById("career-results-title")
                          ?.scrollIntoView();
                      }}
                    >
                      {t("Anterior", "Previous")}
                    </button>
                    <span>
                      {number(results.page, l)} / {number(results.pages, l)}
                    </span>
                    <button
                      disabled={results.page >= results.pages}
                      onClick={() => {
                        change({ page: results.page + 1 });
                        document
                          .getElementById("career-results-title")
                          ?.scrollIntoView();
                      }}
                    >
                      {t("Siguiente", "Next")}
                    </button>
                  </div>
                </>
              )}
            </section>
            <CareerDistributions
              results={results}
              manifest={manifest}
              lang={l}
              change={change}
            />
          </div>
        )
      )}
      <section className="trajectory-method" id="trajectory-method">
        <h2>
          {t(
            "Cómo se construye una trayectoria",
            "How a career record is built",
          )}
        </h2>
        <div className="trajectory-method-content">
          <div>
            <p>
              {t(
                "Exigimos un doctorado de investigación explícito, una fecha de finalización y al menos un empleo con fecha de inicio igual o posterior. No deducimos el doctorado a partir de publicaciones ni del título de profesor.",
                "We require an explicit research doctorate, a completion date and at least one job starting at or after it. We do not infer a doctorate from publications or a professor title.",
              )}
            </p>
            <p>
              {t(
                "ORCID es voluntario: sobrerrepresenta a quienes siguen vinculados a la investigación. Faltan personas, puestos y fechas. Las proporciones describen este archivo; no son probabilidades de colocación ni tasas de paro.",
                "ORCID is voluntary and overrepresents people who remain connected to research. People, jobs and dates are missing. These proportions describe this archive; they are not placement probabilities or unemployment rates.",
              )}
            </p>
          </div>
          <div>
            <p>
              {t(
                "La disciplina se clasifica con reglas sobre el título y departamento del doctorado. El sector combina ROR con reglas sobre nombres de organizaciones; la función se deriva del nombre del puesto. Conservamos los textos originales, los casos sin identificar y las fechas incompletas.",
                "Discipline is classified using rules on the doctoral degree and department. Sector combines ROR with rules on organisation names; function comes from the job title. Original wording, unknown categories and incomplete dates are retained.",
              )}
            </p>
            <p>
              {t(
                "El país es el de la institución, no la nacionalidad de la persona. Europa incluye Reino Unido, Suiza, Rusia, Turquía y Chipre. Un puesto sin fecha de fin no confirma que siga vigente.",
                "Country refers to the institution, not the person's nationality. Europe includes the UK, Switzerland, Russia, Turkey and Cyprus. A job with no end date is not confirmed to be ongoing.",
              )}
            </p>
          </div>
        </div>
        <div className="trajectory-method-links">
          <button onClick={() => navigate("atlas")}>
            {t(
              "Consultar encuestas representativas",
              "View representative surveys",
            )}
            <ArrowUpRight size={16} />
          </button>
          <button onClick={() => navigate("methods")}>
            {t("Método completo", "Full method")}
            <ArrowRight size={16} />
          </button>
          {manifest?.sources.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <ArrowUpRight size={15} />
            </a>
          ))}
          <a href={base + "manifest.json"} download>
            {t("Manifiesto de extracción", "Extraction manifest")}
            <Download size={15} />
          </a>
        </div>
      </section>
      <UniversityEvidence lang={l} />
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </>
  );
}

function CareerDistributions({
  results,
  manifest,
  lang: l,
  change,
  inline = false,
}: {
  results: CareerResults;
  manifest: TrajectoryManifest;
  lang: Lang;
  change: (patch: Partial<TrajectoryFilters>) => void;
  inline?: boolean;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  return (
    <aside
      className={`trajectory-distributions ${inline ? "trajectory-summary-inline" : "trajectory-summary-desktop"}`}
    >
      <details open={!inline}>
        <summary>
          {t("Lo que muestran estos registros", "What these records show")}
          <ChevronDown size={18} />
        </summary>
        <p className="distribution-caveat">
          {t(
            "Distribución de los perfiles filtrados. No representa a toda la población doctorada.",
            "Distribution of the filtered profiles. It does not represent all doctorate holders.",
          )}
        </p>
        <div className="mobility-line">
          <Globe2 size={23} />
          <p>
            <strong>{percent(results.international, results.total, l)}</strong>{" "}
            {t("con empleo en otro país", "with a job in another country")}
            <small>
              {number(results.international, l)} / {number(results.total, l)}{" "}
              {t("perfiles", "profiles")}
            </small>
          </p>
        </div>
        <Distribution
          title={t("Sectores de destino", "Destination sectors")}
          entries={results.sectors}
          total={results.total}
          name={(key) => manifest.sectors[Number(key)][l]}
          onChoose={(key) => change({ sector: key })}
          lang={l}
        />
        <Distribution
          title={t("Países de empleo", "Employment countries")}
          entries={results.destinations.slice(0, 7)}
          total={results.total}
          name={(key) => countryName(key, l)}
          onChoose={(key) => {
            if (key !== "unknown") change({ destination: key });
          }}
          lang={l}
        />
        <Distribution
          title={t("Empleadores declarados", "Reported employers")}
          entries={results.organisations.slice(0, 6)}
          total={results.total}
          name={(key) => key}
          onChoose={(key) => change({ employer: key })}
          lang={l}
        />
        <p className="distribution-caveat">
          {t(
            "El sector combina ROR y reglas sobre nombres; cada ficha explica el criterio. «Sin identificar» se conserva en el denominador. Nombres distintos pueden corresponder al mismo empleador.",
            "Sector combines ROR and name-based rules; each history explains the evidence. Unidentified sectors stay in the denominator. Different names can refer to the same employer.",
          )}
        </p>
      </details>
    </aside>
  );
}

function Distribution({
  title,
  entries,
  total,
  name,
  onChoose,
  lang,
}: {
  title: string;
  entries: [string, number][];
  total: number;
  name: (key: string) => string;
  onChoose: (key: string) => void;
  lang: Lang;
}) {
  return (
    <section className="career-distribution">
      <h3>{title}</h3>
      <ul>
        {entries.map(([key, count]) => (
          <li key={key}>
            <button onClick={() => onChoose(key)}>
              <span>{name(key)}</span>
              <strong>{percent(count, total, lang)}</strong>
            </button>
            <div className="distribution-bar" aria-hidden="true">
              <span
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
            <small>{number(count, lang)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
function CareerEvidence({
  row,
  manifest,
  lang: l,
}: {
  row: CareerRow;
  manifest: TrajectoryManifest;
  lang: Lang;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [detail, setDetail] = useState<CareerDetail | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const shard = manifest.details[row.detailShard];
    const file = shard.file + "?v=" + shard.sha256.slice(0, 16);
    setError(false);
    const request = detailsCache.has(file)
      ? Promise.resolve(detailsCache.get(file)!)
      : fetchCompressed<CareerDetail[]>(base + file).then((data) => {
          detailsCache.set(file, data);
          if (detailsCache.size > 8)
            detailsCache.delete(detailsCache.keys().next().value!);
          return data;
        });
    request
      .then((data) => {
        if (active) setDetail(data[row.detailOffset]);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [row.id, row.detailShard, row.detailOffset, manifest, retry]);
  const affiliation = (a: Affiliation, i: number, isPhd = false) => (
    <li key={`${a.organization}-${i}`}>
      <div className="timeline-date">
        {dateLabel(isPhd ? a.end : a.start, l)}
      </div>
      <div>
        <strong>{a.organization}</strong>
        <p>
          {a.role || t("Puesto no indicado", "Role not stated")}
          {a.department && ` · ${a.department}`}
        </p>
        <small>
          {countryName(a.country, l)}
          {a.city ? ` · ${a.city}` : ""}
          {!isPhd &&
            ` · ${a.end ? `${t("fin", "end")}: ${dateLabel(a.end, l)}` : t("sin fecha de fin declarada", "no end date reported")}`}
        </small>
        <small>
          {t("Añadido por", "Added by")}{" "}
          {a.assertion === "self"
            ? t("cuenta de ORCID", "ORCID account")
            : a.assertion === "integration"
              ? t("integración de ORCID", "ORCID integration")
              : t("fuente sin identificar", "unspecified source")}
          {a.sourceName ? ` (${a.sourceName})` : ""}.
        </small>
        {!isPhd && (
          <small className="sector-evidence">
            <strong>{manifest.sectors[a.classification.sector][l]}</strong>
            {" · "}
            {classificationLabel(a.classification.method, l)}.
            {a.classification.sectorRule &&
              " " +
                t(
                  "Categoría educativa por el nombre; tipo ROR original: ",
                  "Education category from the name; original ROR type: ",
                ) +
                a.classification.rorTypes?.join(", ") +
                "."}
            {!a.classification.sector &&
              " " +
                t(
                  "Sin identificar no significa empresa privada.",
                  "Unidentified does not mean a private company.",
                )}
          </small>
        )}
        {a.classification.ror && (
          <a href={a.classification.ror} target="_blank" rel="noreferrer">
            {a.classification.rorScope === "parent"
              ? t(
                  "Universidad de referencia en ROR",
                  "Reference university in ROR",
                )
              : t("Organización en ROR", "Organisation in ROR")}
            <ArrowUpRight size={12} />
          </a>
        )}
        {a.classification.conflictingRor && (
          <small>
            <a
              href={a.classification.conflictingRor}
              target="_blank"
              rel="noreferrer"
            >
              {t(
                "Identificador de origen en conflicto",
                "Conflicting source identifier",
              )}
              <ArrowUpRight size={12} />
            </a>
          </small>
        )}
      </div>
    </li>
  );
  return (
    <div className="career-evidence" id={`detail-${row.id}`}>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "No se ha podido cargar la evidencia.",
              "The evidence could not be loaded.",
            )}
          </p>
          <button className="text-link" onClick={() => setRetry((x) => x + 1)}>
            {t("Reintentar", "Try again")}
          </button>
        </div>
      ) : !detail ? (
        <p role="status">
          {t("Cargando el historial…", "Loading career history…")}
        </p>
      ) : (
        <>
          <div className="career-evidence-heading">
            <h4>
              {t(
                "Educación y empleos declarados",
                "Reported education and employment",
              )}
            </h4>
            <a
              href={`https://orcid.org/${detail.id}`}
              target="_blank"
              rel="noreferrer"
            >
              ORCID {detail.id}
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p>
            {t(
              "Archivo del 1 de octubre de 2025. La página de ORCID puede haber cambiado desde entonces.",
              "Archive dated 1 October 2025. The ORCID page may have changed since then.",
            )}
          </p>
          {row.ambiguous && (
            <p className="evidence-note">
              {t(
                "El primer puesto y el doctorado figuran en el mismo año y faltan meses o días: su orden exacto no está confirmado.",
                "The first job and doctorate share a year and months or days are missing: their exact order is unconfirmed.",
              )}
            </p>
          )}
          <h5>{t("Doctorado terminado", "Completed doctorate")}</h5>
          <ol className="career-timeline">
            {detail.doctorates.map((a, i) => affiliation(a, i, true))}
          </ol>
          <h5>
            {t(
              "Empleos con inicio posterior o en el mismo año",
              "Jobs starting later or in the same year",
            )}
          </h5>
          <ol className="career-timeline">
            {detail.employments.map((a, i) => affiliation(a, i))}
          </ol>
          <p className="evidence-note">
            {t(
              "La lista puede ser incompleta y contener puestos simultáneos. «Posdoctorado» solo se asigna cuando el título lo indica. Una integración de ORCID no garantiza verificación por el empleador.",
              "This list may be incomplete and include concurrent jobs. A postdoctoral role is assigned only when the title states it. An ORCID integration does not guarantee employer verification.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
function UniversityEvidence({ lang: l }: { lang: Lang }) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [data, setData] = useState<UniversityData | null>(null),
    [q, setQ] = useState(""),
    [source, setSource] = useState(""),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [limit, setLimit] = useState(8);
  useEffect(() => {
    let active = true;
    setError(false);
    fetch(`${import.meta.env.BASE_URL}data/university-careers.json`)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const rows =
    data?.records.filter(
      (r) =>
        (!source || r.source === source) &&
        fold(
          [r.name, r.institution, r.doctoralDetail, ...r.appointments].join(
            " ",
          ),
        ).includes(fold(q)),
    ) || [];
  return (
    <section className="university-evidence" id="university-evidence">
      <h2>
        {t("Lo que publican las universidades", "What universities publish")}
      </h2>
      <p>
        {t(
          "Fichas extraídas de listas públicas de Filosofía, Física y Ciencias. Incluyen destinos que pueden faltar en ORCID. Son muestras seleccionadas y no se suman a las estadísticas anteriores, para evitar contar a una persona dos veces.",
          "Entries extracted from public Philosophy, Physics and Science placement lists. They include destinations that may be absent from ORCID. These selected samples are not added to the statistics above, to avoid counting a person twice.",
        )}
      </p>
      <div className="university-filters">
        <label>
          {t("Buscar en listas universitarias", "Search university lists")}
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(8);
            }}
            placeholder={t(
              "Nombre, empleador o especialidad",
              "Name, employer or specialism",
            )}
          />
        </label>
        <label>
          {t("Universidad de origen", "Doctoral university")}
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setLimit(8);
            }}
          >
            <option value="">{t("Todas las listas", "All lists")}</option>
            {data?.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.institution} ({s.records})
              </option>
            ))}
          </select>
        </label>
        <a
          href={`${import.meta.env.BASE_URL}data/university-careers.csv`}
          download
        >
          <Download size={17} /> CSV
        </a>
      </div>
      {error ? (
        <div role="alert">
          {t(
            "No se han podido cargar las listas.",
            "The lists could not be loaded.",
          )}{" "}
          <button className="text-link" onClick={() => setRetry((x) => x + 1)}>
            {t("Reintentar", "Try again")}
          </button>
        </div>
      ) : !data ? (
        <p role="status">{t("Cargando listas…", "Loading lists…")}</p>
      ) : (
        <>
          <p className="university-count">
            {rows.length}{" "}
            {t(
              "fichas de fuente · no son personas únicas entre fuentes",
              "source entries · not unique people across sources",
            )}
          </p>
          <div className="university-list">
            {rows.slice(0, limit).map((r, i) => (
              <details key={`${r.source}-${r.name}-${i}`}>
                <summary>
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.institution} · {r.doctoralDetail}
                    </small>
                  </span>
                  <ChevronDown size={18} />
                </summary>
                <ul>
                  {r.appointments.map((a, j) => (
                    <li key={j}>{a}</li>
                  ))}
                </ul>
                <p>
                  {r.source === "oxford"
                    ? t(
                        "Nombramientos anunciados; pueden incluir puestos futuros. El año de publicación no es necesariamente el inicio del empleo.",
                        "Announced appointments may include future jobs. Publication year is not necessarily the job start year.",
                      )
                    : t(
                        "La fuente no fecha cada observación de empleo. No confirma el puesto actual.",
                        "The source does not date each employment observation. It does not confirm a current job.",
                      )}
                </p>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {t("Ver lista original", "View original list")}
                  <ArrowUpRight size={15} />
                </a>
              </details>
            ))}
          </div>
          {!rows.length && (
            <p>
              {t(
                "No hay fichas con esta búsqueda.",
                "No entries match this search.",
              )}
            </p>
          )}
          {rows.length > limit && (
            <button
              className="button university-more"
              onClick={() => setLimit((x) => x + 20)}
            >
              {t("Mostrar más fichas", "Show more entries")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
