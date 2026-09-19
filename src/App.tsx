import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Search,
  Download,
  Share2,
  Check,
  X,
  SlidersHorizontal,
  BookOpen,
  Database,
  GitBranch,
  MapPin,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Route,
  ChartNoAxesCombined,
  Compass,
  Menu,
} from "lucide-react";
import Trajectories from "./Trajectories";
import type { Dataset, Row, Lang, Placement, Source, DataTable } from "./types";
import {
  csv,
  download,
  exportRows,
  norm,
  number,
  pct,
  yearLabel,
} from "./utils";
import {
  studies,
  careers,
  sectors,
  institutions,
  placementTypes,
} from "./content";

const colors = ["#86452f", "#187a78", "#9a4883", "#aa661a", "#657387"];
const views = [
  "trajectories",
  "atlas",
  "compare",
  "placements",
  "careers",
  "studies",
  "sources",
  "tables",
] as const;
type View = (typeof views)[number];
type State = {
  view: View | "methods";
  dataset: string;
  field: string;
  year: string;
  horizon: string;
  lang: Lang;
  compare: string;
};
function readState(): State {
  const p = new URLSearchParams(location.search);
  const view = p.get("view") || "trajectories";
  return {
    view: [...views, "methods"].includes(view)
      ? (view as State["view"])
      : "trajectories",
    dataset: p.get("dataset") || "sed",
    field: p.get("field") || "",
    year: p.get("year") || "",
    horizon: p.get("horizon") || "",
    lang: p.get("lang") === "en" ? "en" : "es",
    compare: p.get("compare") || "",
  };
}
const viewLabels = {
  trajectories: ["Trayectorias", "Careers"],
  atlas: ["Estadísticas", "Statistics"],
  compare: ["Comparar", "Compare"],
  placements: ["Archivo de Economía", "Economics archive"],
  careers: ["Opciones", "Pathways"],
  studies: ["Estudios", "Studies"],
  sources: ["Fuentes", "Sources"],
  tables: ["Datos", "Data"],
  methods: ["Cómo leer los datos", "How to read the data"],
};
const primaryViews = ["trajectories", "atlas", "careers", "studies"] as const;
const cache = new Map<string, unknown>();
function useData<T>(file: string) {
  const [data, setData] = useState<T | null>((cache.get(file) as T) || null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    setData((cache.get(file) as T) || null);
    if (cache.has(file)) return;
    fetch(`${import.meta.env.BASE_URL}data/${file}`)
      .then((r) => {
        if (!r.ok) throw Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        cache.set(file, d);
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [file, retry]);
  return { data, error, reload: () => setRetry((x) => x + 1) };
}
function Loading({
  error,
  reload,
  lang,
}: {
  error: boolean;
  reload: () => void;
  lang: Lang;
}) {
  return (
    <div className="load-state" role={error ? "alert" : "status"}>
      <Database size={28} />
      <p>
        {error
          ? lang === "es"
            ? "No hemos podido cargar estos datos. Comprueba la conexión e inténtalo de nuevo."
            : "We could not load this data. Check your connection and try again."
          : lang === "es"
            ? "Preparando los datos…"
            : "Preparing the data…"}
      </p>
      {error && (
        <button className="button" onClick={reload}>
          {lang === "es" ? "Volver a intentar" : "Try again"}
        </button>
      )}
    </div>
  );
}
function SourceLink({ url, children }: { url: string; children: ReactNode }) {
  return (
    <a className="source-link" href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={15} />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}
function SearchBox({
  value,
  set,
  placeholder,
  label,
}: {
  value: string;
  set: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="searchbox">
      <Search size={18} />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          aria-label={
            label.startsWith("Search") ? "Clear search" : "Borrar búsqueda"
          }
          onClick={() => set("")}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
function Empty({ lang, reset }: { lang: Lang; reset?: () => void }) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>
        {lang === "es"
          ? "No hay resultados con estos filtros"
          : "No results with these filters"}
      </h3>
      <p>
        {lang === "es"
          ? "Prueba otro término o amplía la selección."
          : "Try another term or broaden your selection."}
      </p>
      {reset && (
        <button className="button secondary" onClick={reset}>
          {lang === "es" ? "Restablecer filtros" : "Reset filters"}
        </button>
      )}
    </div>
  );
}
function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(readState);
  const { data, error, reload } = useData<Dataset[]>("datasets.json");
  const [toast, setToast] = useState("");
  const menuRef = useRef<HTMLDialogElement>(null);
  const l = state.lang;
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const update = (patch: Partial<State>, push = false) => {
    const n = { ...state, ...patch };
    const p = new URLSearchParams(location.search);
    Object.entries(n).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    history[push ? "pushState" : "replaceState"](
      null,
      "",
      `${location.pathname}?${p}`,
    );
    setState(n);
  };
  useEffect(() => {
    const fn = () => setState(readState());
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  useEffect(() => {
    document.documentElement.lang = l;
    document.title = `Posdata · ${t("Después del doctorado", "After the doctorate")}`;
  }, [l]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const nav = (view: State["view"]) => {
    menuRef.current?.close();
    update({ view }, true);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => document.getElementById("main")?.focus());
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setToast(t("Enlace de esta vista copiado.", "Link to this view copied."));
    } catch {
      setToast(
        t(
          "Puedes copiar el enlace desde la barra de direcciones.",
          "You can copy the link from the address bar.",
        ),
      );
    }
  };
  const ds = data?.find((d) => d.id === state.dataset) || data?.[0];
  const years = ds
    ? [...new Set(ds.records.map((r) => r.year))].sort().reverse()
    : [];
  const yr = years.includes(state.year) ? state.year : ds?.year || "";
  const horizons = ds
    ? [
        ...new Set(
          ds.records.filter((r) => r.year === yr).map((r) => r.horizon),
        ),
      ].sort((a, b) => Number(a) - Number(b))
    : [];
  const horizon = horizons.includes(state.horizon)
    ? state.horizon
    : ds?.id === "france"
      ? "3"
      : ds?.id === "leo"
        ? "5"
        : horizons[0];
  const rows =
    ds?.records.filter((r) => r.year === yr && r.horizon === horizon) || [];
  const row =
    rows.find((r) => r.field === state.field) ||
    rows.find((r) => ["All fields", "Ensemble", "Total"].includes(r.field)) ||
    rows[0];
  const chooseDs = (id: string) =>
    update({ dataset: id, year: "", horizon: "", field: "", compare: "" });
  const filters = ds && (
    <div className="context-controls">
      <label>
        {t("Población y momento", "Population & time")}
        <select
          aria-label={t("Fuente de datos", "Data source")}
          value={ds.id}
          onChange={(e) => chooseDs(e.target.value)}
        >
          {data!.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name[l]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {ds.id === "france"
          ? t("Cohorte", "Cohort")
          : t("Año del dato", "Data year")}
        {years.length > 1 ? (
          <select
            aria-label={t("Año del dato", "Data year")}
            value={yr}
            onChange={(e) => update({ year: e.target.value, compare: "" })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {yearLabel(y)}
              </option>
            ))}
          </select>
        ) : (
          <span className="static-value">{yr}</span>
        )}
      </label>
      <label>
        {t("Desde el doctorado", "Since the doctorate")}
        {horizons.length > 1 ? (
          <select
            aria-label={t("Años desde el doctorado", "Years since doctorate")}
            value={horizon}
            onChange={(e) => update({ horizon: e.target.value, compare: "" })}
          >
            {horizons.map((h) => (
              <option key={h} value={h}>
                {h} {t("años", "years")}
              </option>
            ))}
          </select>
        ) : (
          <span className="static-value">
            {horizon === "0"
              ? t("Al terminar", "At graduation")
              : t("Todas las etapas", "All career stages")}
          </span>
        )}
      </label>
      <button
        className="icon-button share-button"
        onClick={share}
        aria-label={t("Compartir esta vista", "Share this view")}
        title={t("Copiar enlace", "Copy link")}
      >
        <Share2 size={19} />
      </button>
    </div>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Saltar al contenido", "Skip to content")}
      </a>
      <header className="masthead">
        <div className="header-inner">
          <a
            className="brand"
            href="?view=trajectories"
            onClick={(e) => {
              e.preventDefault();
              nav("trajectories");
            }}
            aria-label="Posdata — inicio"
          >
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
            <span>
              posdata
              <span className="brand-description">
                {t("después del doctorado", "after the doctorate")}
              </span>
            </span>
          </a>
          <nav
            className="desktop-navigation"
            aria-label={t("Navegación principal", "Main navigation")}
          >
            {primaryViews.map((v) => (
              <a
                key={v}
                href={`?view=${v}&lang=${l}`}
                aria-current={state.view === v ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  nav(v);
                }}
              >
                {viewLabels[v][l === "es" ? 0 : 1]}
              </a>
            ))}
            <button
              className="more-navigation"
              onClick={() => menuRef.current?.showModal()}
              aria-label={t("Más secciones", "More sections")}
              aria-haspopup="dialog"
            >
              <Menu size={18} />
              {t("Más", "More")}
            </button>
          </nav>
          <button
            className="language"
            onClick={() => update({ lang: l === "es" ? "en" : "es" })}
            aria-label={l === "es" ? "Switch to English" : "Cambiar a español"}
          >
            {l === "es" ? "EN" : "ES"}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </header>
      <dialog
        ref={menuRef}
        className="navigation-dialog"
        aria-labelledby="menu-title"
      >
        <div className="navigation-dialog-heading">
          <h2 id="menu-title">{t("Explora Posdata", "Explore Posdata")}</h2>
          <button
            autoFocus
            onClick={() => menuRef.current?.close()}
            aria-label={t("Cerrar menú", "Close menu")}
          >
            <X size={23} />
          </button>
        </div>
        <nav aria-label={t("Todas las secciones", "All sections")}>
          {[...views, "methods" as const].map((v) => (
            <a
              key={v}
              href={`?view=${v}&lang=${l}`}
              aria-current={state.view === v ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                nav(v);
              }}
            >
              <span>{viewLabels[v][l === "es" ? 0 : 1]}</span>
              <ArrowUpRight size={19} />
            </a>
          ))}
        </nav>
      </dialog>
      <nav
        className="mobile-navigation"
        aria-label={t("Navegación móvil", "Mobile navigation")}
      >
        {(["trajectories", "atlas", "careers"] as const).map((v, i) => {
          const Icon = [Route, ChartNoAxesCombined, Compass][i];
          return (
            <a
              key={v}
              href={`?view=${v}&lang=${l}`}
              aria-current={state.view === v ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                nav(v);
              }}
            >
              <Icon size={21} />
              <span>{viewLabels[v][l === "es" ? 0 : 1]}</span>
            </a>
          );
        })}
        <button
          onClick={() => menuRef.current?.showModal()}
          aria-label={t("Más secciones", "More sections")}
          aria-haspopup="dialog"
          className={
            !["trajectories", "atlas", "careers"].includes(state.view)
              ? "is-current"
              : ""
          }
        >
          <Menu size={21} />
          <span>{t("Más", "More")}</span>
        </button>
      </nav>
      <main id="main" tabIndex={-1} className="shell">
        {state.view === "trajectories" ? (
          <Trajectories lang={l} navigate={nav} />
        ) : !data ? (
          <Loading error={error} reload={reload} lang={l} />
        ) : (
          <>
            {(state.view === "atlas" || state.view === "compare") && filters}
            {state.view === "atlas" && ds && row && (
              <Atlas
                d={ds}
                row={row}
                rows={rows}
                lang={l}
                setField={(field) => update({ field })}
                navigate={nav}
              />
            )}
            {state.view === "compare" && ds && (
              <Compare
                key={`${ds.id}-${yr}-${horizon}`}
                d={ds}
                rows={rows}
                lang={l}
                selection={state.compare}
                setSelection={(compare) => update({ compare })}
              />
            )}
            {state.view === "placements" && <Placements lang={l} />}
            {state.view === "careers" && <Careers lang={l} navigate={nav} />}
            {state.view === "studies" && <Studies lang={l} />}
            {state.view === "sources" && <Sources lang={l} navigate={nav} />}
            {state.view === "tables" && <Tables lang={l} />}
            {state.view === "methods" && <Methods lang={l} />}
          </>
        )}
      </main>
      <footer>
        <div className="footer-inner">
          <div>
            <strong>posdata</strong>
            <p>
              {t(
                "Un doctorado. Muchas formas de aportar.",
                "One doctorate. Many ways to contribute.",
              )}
            </p>
          </div>
          <div className="footer-links">
            <button onClick={() => nav("methods")}>
              {t("Cómo leer los datos", "How to read the data")}
            </button>
            <SourceLink url="https://github.com/aleetreny/posdata">
              GitHub
            </SourceLink>
            <a href={`${import.meta.env.BASE_URL}data/sources.csv`} download>
              {t("Descargar fuentes", "Download sources")}
            </a>
          </div>
          <p className="edition">
            {t(
              "Edición del 19 sep 2026. Cada fuente conserva su fecha y licencia.",
              "Edition: 19 Sep 2026. Each source retains its date and licence.",
            )}
            <br />
            {t(
              "Sin cuentas. Sin rastreo. Datos públicos, límites visibles.",
              "No accounts. No tracking. Public data, visible limits.",
            )}
          </p>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}

function Atlas({
  d,
  row,
  rows,
  lang: l,
  setField,
  navigate,
}: {
  d: Dataset;
  row: Row;
  rows: Row[];
  lang: Lang;
  setField: (s: string) => void;
  navigate: (v: State["view"]) => void;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState("map");
  useEffect(() => {
    setDetail(null);
    setQuery("");
    setShowAll(false);
  }, [d.id]);
  const filtered = rows.filter(
    (r) =>
      (showAll || query || r.broad) &&
      norm(r.label[l] + " " + r.field).includes(norm(query)),
  );
  const salary =
    row.salary == null
      ? "—"
      : new Intl.NumberFormat(l === "es" ? "es-ES" : "en-US", {
          style: "currency",
          currency: d.currency,
          maximumFractionDigits: 0,
        }).format(row.salary);
  return (
    <>
      <PageTitle
        title={t(
          "Tu doctorado. Muchos destinos.",
          "Your doctorate. Many destinations.",
        )}
        description={t(
          "Explora qué ocurre después, con la evidencia a la vista.",
          "Explore what comes next, with the evidence in view.",
        )}
      />
      <div className="atlas-workspace">
        <aside className="discipline-panel">
          <div className="panel-title">
            <h2>{t("Elige tu disciplina", "Choose your discipline")}</h2>
            <span>{rows.length}</span>
          </div>
          <SearchBox
            value={query}
            set={setQuery}
            label={t("Buscar disciplina", "Search disciplines")}
            placeholder={t(
              "Historia, biología, física…",
              "History, biology, physics…",
            )}
          />
          <div
            className="discipline-list"
            aria-label={t("Disciplinas", "Disciplines")}
          >
            {filtered.map((r) => (
              <button
                key={r.id}
                className={r.id === row.id ? "selected" : ""}
                onClick={() => setField(r.field)}
                aria-pressed={r.id === row.id}
              >
                <span>{r.label[l]}</span>
                {r.id === row.id ? (
                  <ArrowRight size={16} />
                ) : (
                  <span className="discipline-dot" />
                )}
              </button>
            ))}
            {!filtered.length && (
              <p className="small-note">
                {t(
                  "Ninguna disciplina coincide. Prueba un término más amplio.",
                  "No matching discipline. Try a broader term.",
                )}
              </p>
            )}
          </div>
          {rows.some((r) => !r.broad) && (
            <button
              className="text-button show-fields"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? t("Solo grandes áreas", "Broad fields only")
                : t("Mostrar también subcampos", "Include subfields")}
              {showAll ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          <p className="panel-foot">
            {t(
              "Cada fuente conserva su clasificación. Las áreas amplias incluyen a sus subcampos.",
              "Each source retains its classification. Broad fields include their subfields.",
            )}
          </p>
        </aside>
        <section
          className="atlas-results"
          aria-label={t("Resultados", "Results")}
        >
          <div className="results-heading">
            <div>
              <h2>{row.label[l]}</h2>
              <p>
                {d.title[l]} · {yearLabel(row.year)}
                {row.cohort && ` · ${t("cohorte", "cohort")} ${row.cohort}`}
              </p>
            </div>
            <div
              className="segmented"
              aria-label={t("Presentación", "Display")}
            >
              <button
                aria-pressed={mode === "map"}
                onClick={() => setMode("map")}
              >
                <GitBranch size={15} />
                {t("Mapa", "Map")}
              </button>
              <button
                aria-pressed={mode === "table"}
                onClick={() => setMode("table")}
              >
                <Layers size={15} />
                {t("Tabla", "Table")}
              </button>
            </div>
          </div>
          <p className="figure-context">{d.denominator[l]}</p>
          {d.id === "sdr" && (
            <p className="coverage-context">
              {t(
                "Cobertura: doctorados estadounidenses en ciencias, ingeniería y salud; residentes en EE. UU. y menores de 76 años.",
                "Coverage: US doctorates in science, engineering and health; US residents under 76.",
              )}
            </p>
          )}
          {mode === "map" ? (
            <div className="route-map">
              <div className="origin">
                <span className="origin-node" />
                <div>
                  <strong>{t("Doctorado", "Doctorate")}</strong>
                  <span>
                    {d.id === "sed"
                      ? t("Compromiso confirmado", "Definite commitment")
                      : d.id === "leo"
                        ? t("Registro enlazado", "Matched record")
                        : t("Empleo observado", "Observed employment")}
                  </span>
                  <small>
                    {d.unit === "count"
                      ? number(row.denominator, l)
                      : number(row.total, l)}{" "}
                    {d.unit === "count"
                      ? t("personas", "people")
                      : t("en la base¹", "in the base¹")}
                  </small>
                </div>
              </div>
              <svg
                className="routes"
                viewBox="0 0 220 320"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {d.categories.map((_, i) => {
                  const p = pct(d, row, i);
                  const y = ((i + 0.5) * 320) / d.categories.length;
                  return (
                    <path
                      key={i}
                      d={`M 0 160 C 85 160, 120 ${y}, 220 ${y}`}
                      fill="none"
                      stroke={colors[i]}
                      strokeWidth={p == null ? 2 : Math.max(1, p * 0.48)}
                      strokeDasharray={p == null ? "4 4" : undefined}
                      opacity={detail == null || detail === i ? 0.85 : 0.17}
                    />
                  );
                })}
              </svg>
              <div className="destinations">
                {d.categories.map((cat, i) => (
                  <button
                    className={`destination ${detail === i ? "active" : ""}`}
                    key={cat.en}
                    onClick={() => setDetail(detail === i ? null : i)}
                    aria-expanded={detail === i}
                    style={
                      { "--route-color": colors[i] } as React.CSSProperties
                    }
                  >
                    <span className="endpoint" />
                    <span className="destination-label">{cat[l]}</span>
                    <strong>
                      {pct(d, row, i) == null
                        ? "—"
                        : number(pct(d, row, i), l, 1) + "%"}
                    </strong>
                    <Info size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t("Tabla desplazable", "Scrollable table")}
            >
              <table className="data-table">
                <caption className="sr-only">
                  {row.label[l]} — {d.title[l]}
                </caption>
                <thead>
                  <tr>
                    <th>{t("Destino", "Destination")}</th>
                    <th>{t("Porcentaje", "Percentage")}</th>
                    <th>{t("Dato original", "Original value")}</th>
                    {row.se && <th>{t("Error estándar", "Standard error")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {d.categories.map((c, i) => (
                    <tr key={c.en}>
                      <th>{c[l]}</th>
                      <td>{number(pct(d, row, i), l, 1)}%</td>
                      <td>
                        {number(row.values[i], l, d.unit === "percent" ? 1 : 0)}
                      </td>
                      {row.se && <td>{number(row.se[i], l)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {detail != null && (
            <div className="destination-detail">
              <strong style={{ color: colors[detail] }}>
                {d.categories[detail][l]}
              </strong>
              <p>
                {number(row.values[detail], l, d.unit === "percent" ? 1 : 0)}{" "}
                {d.unit === "percent"
                  ? t(
                      "% publicado (salvo diferencias calculadas en LEO).",
                      "% reported (except calculated differences in LEO).",
                    )
                  : t(
                      "personas en esta categoría.",
                      "people in this category.",
                    )}{" "}
                {row.se &&
                  `${t("Error estándar del recuento", "Count standard error")}: ${number(row.se[detail], l)}.`}
              </p>
              <button
                onClick={() => setDetail(null)}
                aria-label={t("Cerrar detalle", "Close detail")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="results-ledger">
            <div>
              <span>
                {d.salaryPeriod === "month-net"
                  ? t("Salario mediano · neto/mes", "Median pay · net/month")
                  : t("Ingresos medianos · año", "Median earnings · year")}
              </span>
              <strong>{salary}</strong>
              <small>
                {d.id === "sed"
                  ? t(
                      "Puesto previsto, excluye postdocs.",
                      "Expected job, excluding postdocs.",
                    )
                  : d.id === "sdr"
                    ? t("Empleo a tiempo completo.", "Full-time employment.")
                    : d.id === "france"
                      ? t(
                          "Importes históricos, sin ajuste de inflación.",
                          "Historical amounts, not inflation-adjusted.",
                        )
                      : t(
                          "Ingresos nominales, jornada no ajustada.",
                          "Nominal earnings, hours not adjusted.",
                        )}
              </small>
              {d.salaryTable && (
                <SourceLink
                  url={`${d.url.replace("/data-tables", "")}/assets/data-tables/tables/${d.salaryTable}.xlsx`}
                >
                  {t("Tabla de ingresos", "Earnings table")}
                </SourceLink>
              )}
            </div>
            <div>
              <span>{t("Qué entra en la base", "What is in the base")}</span>
              <strong className="smaller-value">
                {number(row.total, l)}{" "}
                {t(
                  d.unit === "count" ? "personas" : "registros",
                  d.unit === "count" ? "people" : "records",
                )}
              </strong>
              <small>
                {d.id === "sed"
                  ? `${number(row.committed, l)} ${t("con compromiso confirmado;", "with a definite commitment;")} ${number(row.abroad, l)} ${t("en el extranjero.", "abroad.")}`
                  : d.id === "sdr"
                    ? t(
                        "Población estimada; no número de encuestados.",
                        "Estimated population, not sample size.",
                      )
                    : d.id === "france"
                      ? t(
                          "Respuestas a la encuesta, no todas en empleo.",
                          "Survey responses, not all employed.",
                        )
                      : t(
                          "Titulados enlazados. No es toda la cohorte.",
                          "Matched graduates, not the entire cohort.",
                        )}
              </small>
            </div>
            <div>
              <span>{t("Una lectura útil", "A useful reading")}</span>
              {row.employment != null ? (
                <>
                  <strong>{number(row.employment, l, 1)}%</strong>
                  <small>
                    {d.id === "france"
                      ? t(
                          "Tasa de inserción entre población activa.",
                          "Employment rate among the active population.",
                        )
                      : t(
                          "En empleo sostenido, con o sin estudios.",
                          "In sustained employment, with or without study.",
                        )}
                  </small>
                </>
              ) : (
                <>
                  <strong className="smaller-value">
                    {t("Sector ≠ función", "Sector ≠ function")}
                  </strong>
                  <small>
                    {t(
                      "Se puede investigar fuera de la universidad y trabajar en ella sin investigar.",
                      "Research happens outside universities; university work is not always research.",
                    )}
                  </small>
                </>
              )}
              {row.stable != null && (
                <small>
                  {number(row.stable, l)}%{" "}
                  {t("en empleo estable.", "in stable employment.")}
                </small>
              )}
            </div>
          </div>
          <details className="data-note">
            <summary>
              <Info size={16} />
              {t(
                "Población, límites y cómo interpretar este gráfico",
                "Population, limits and how to read this chart",
              )}
            </summary>
            <p>{d.population[l]}</p>
            <p>{d.note[l]}</p>
            <p>
              {t(
                "— indica un valor no disponible o suprimido. No se sustituye por cero. Las líneas reflejan las proporciones; no representan trayectorias individuales.",
                "— indicates an unavailable or suppressed value. It is not replaced with zero. Lines reflect shares; they do not represent individual trajectories.",
              )}
            </p>
            {d.id === "leo" && (
              <p>
                {t(
                  "Empleo y estudios = empleo con o sin estudios − solo empleo. Solo estudios = empleo o estudios − empleo con o sin estudios. Diferencias calculadas con porcentajes ya redondeados.",
                  "Employment & study = employment with or without study − employment only. Study only = employment or study − employment with or without study. Differences use already rounded percentages.",
                )}
              </p>
            )}
          </details>
          <div className="result-actions">
            <SourceLink url={d.url}>
              {t("Consultar fuente original", "Open original source")}
            </SourceLink>
            <button
              className="text-button"
              onClick={() => exportRows(d, [row], l)}
            >
              <Download size={15} />
              {t("Descargar esta selección", "Download this selection")}
            </button>
          </div>
        </section>
      </div>
      <div className="next-questions">
        <h2>{t("Sigue la pregunta.", "Follow the question.")}</h2>
        <button onClick={() => navigate("compare")}>
          <span>
            {t("¿Y en otras disciplinas?", "What about other disciplines?")}
          </span>
          {t(
            "Comparar con el mismo contexto",
            "Compare within the same context",
          )}
          <ArrowRight size={22} />
        </button>
        <button onClick={() => navigate("careers")}>
          <span>{t("¿Qué podría hacer yo?", "What could I do?")}</span>
          {t(
            "Explorar funciones profesionales",
            "Explore professional functions",
          )}
          <ArrowRight size={22} />
        </button>
        <button onClick={() => navigate("studies")}>
          <span>
            {t("¿Qué dice la investigación?", "What does the research say?")}
          </span>
          {t("Leer estudios sobre trayectorias", "Read career-path studies")}
          <ArrowRight size={22} />
        </button>
      </div>
    </>
  );
}

function Compare({
  d,
  rows,
  lang: l,
  selection,
  setSelection,
}: {
  d: Dataset;
  rows: Row[];
  lang: Lang;
  selection: string;
  setSelection: (v: string) => void;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const chosen = selection
    ? selection.split("|").filter((id) => rows.some((r) => r.id === id))
    : rows
        .filter((r) => r.broad)
        .slice(1, 4)
        .map((r) => r.id);
  const setChosen = (n: string[] | ((v: string[]) => string[])) => {
    const a = typeof n === "function" ? n(chosen) : n;
    setSelection(a.join("|") || "-");
  };
  const [query, setQuery] = useState("");
  const selected = rows.filter((r) => chosen.includes(r.id));
  const toggle = (id: string) =>
    setChosen((v) =>
      v.includes(id)
        ? v.filter((x) => x !== id)
        : v.length < 4
          ? [...v, id]
          : v,
    );
  return (
    <>
      <PageTitle
        title={t("Comparar sin mezclar.", "Compare like with like.")}
        description={t(
          "Hasta cuatro disciplinas, una misma fuente, población y momento.",
          "Up to four disciplines, one source, population and time point.",
        )}
      >
        <button
          className="button secondary"
          disabled={!selected.length}
          onClick={() => exportRows(d, selected, l)}
        >
          <Download size={17} />
          {t("Descargar comparación", "Download comparison")}
        </button>
      </PageTitle>
      <div className="compare-layout">
        <aside>
          <h2>
            {t("Disciplinas", "Disciplines")}{" "}
            <span className="subtle">{chosen.length}/4</span>
          </h2>
          <SearchBox
            value={query}
            set={setQuery}
            placeholder={t("Añadir una disciplina", "Add a discipline")}
            label={t("Buscar para comparar", "Search to compare")}
          />
          <div className="compare-choices">
            {rows
              .filter((r) => norm(r.label[l]).includes(norm(query)))
              .map((r) => (
                <label key={r.id}>
                  <input
                    type="checkbox"
                    checked={chosen.includes(r.id)}
                    disabled={chosen.length === 4 && !chosen.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <span>{r.label[l]}</span>
                </label>
              ))}
          </div>
          <button
            className="text-button"
            onClick={() => setChosen([])}
            disabled={!chosen.length}
          >
            {t("Limpiar selección", "Clear selection")}
          </button>
        </aside>
        <section>
          {selected.length ? (
            <>
              <div className="legend">
                {d.categories.map((c, i) => (
                  <span key={c.en}>
                    <i style={{ background: colors[i] }} />
                    {c[l]}
                  </span>
                ))}
              </div>
              <div className="comparison-bars">
                {selected.map((r) => (
                  <div key={r.id}>
                    <h3>{r.label[l]}</h3>
                    <div
                      className="stacked"
                      aria-label={d.categories
                        .map(
                          (c, i) => `${c[l]}: ${number(pct(d, r, i), l, 1)}%`,
                        )
                        .join("; ")}
                    >
                      {r.values.map((v, i) => (
                        <span
                          key={i}
                          style={{
                            background: colors[i],
                            width: `${pct(d, r, i) || 0}%`,
                          }}
                          title={`${d.categories[i][l]}: ${number(pct(d, r, i), l, 1)}%`}
                        >
                          {pct(d, r, i)! > 10
                            ? `${number(pct(d, r, i), l)}%`
                            : ""}
                        </span>
                      ))}
                    </div>
                    {r.values.some((v) => v === null) && (
                      <p className="small-note">
                        {t(
                          "Hay celdas suprimidas; la barra no muestra una distribución completa.",
                          "Some cells are suppressed; the bar is not a complete distribution.",
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label={t("Tabla desplazable", "Scrollable table")}
              >
                <table className="data-table comparison-table">
                  <caption>
                    {t("Porcentajes por destino", "Shares by destination")}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t("Destino", "Destination")}</th>
                      {selected.map((r) => (
                        <th key={r.id}>{r.label[l]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.categories.map((c, i) => (
                      <tr key={c.en}>
                        <th>{c[l]}</th>
                        {selected.map((r) => (
                          <td key={r.id}>{number(pct(d, r, i), l, 1)}%</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th>
                        {t(
                          "Base de referencia (n)",
                          "Reference population (n)",
                        )}
                      </th>
                      {selected.map((r) => (
                        <td key={r.id}>
                          {number(
                            d.unit === "count" ? r.denominator : r.total,
                            l,
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th>
                        {t("Ingreso mediano", "Median income")} ({d.currency})
                      </th>
                      {selected.map((r) => (
                        <td key={r.id}>{number(r.salary, l)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="small-note">
                {d.denominator[l]} {d.note[l]}
              </p>
              <SourceLink url={d.url}>
                {t("Definiciones y fuente", "Definitions & source")}
              </SourceLink>
            </>
          ) : (
            <Empty lang={l} />
          )}
        </section>
      </div>
    </>
  );
}

function Placements({ lang: l }: { lang: Lang }) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const { data, error, reload } = useData<Placement[]>("placements.json");
  const [q, sq] = useState("");
  const [inst, si] = useState("");
  const [type, st] = useState("");
  const [year, sy] = useState("");
  const [page, sp] = useState(0);
  const [sort, ss] = useState("new");
  useEffect(() => sp(0), [q, inst, type, year, sort]);
  const result = useMemo(
    () =>
      data
        ?.filter(
          (r) =>
            (!inst || r.institution === inst) &&
            (!type || r.type === type) &&
            (!year || String(r.year) === year) &&
            norm(
              `${r.name} ${r.employer} ${r.field} ${institutions[r.institution]}`,
            ).includes(norm(q)),
        )
        .sort((a, b) =>
          sort === "new"
            ? b.year - a.year
            : sort === "old"
              ? a.year - b.year
              : a.employer.localeCompare(b.employer),
        ) || [],
    [data, q, inst, type, year, sort],
  );
  const reset = () => {
    sq("");
    si("");
    st("");
    sy("");
    ss("new");
  };
  return (
    <>
      <PageTitle
        title={t("De una tesis a un lugar.", "From a thesis to a place.")}
        description={t(
          "6.512 registros históricos de primeros destinos en Economía, de 29 departamentos.",
          "6,512 historical first-placement records in Economics, from 29 departments.",
        )}
      >
        <button
          className="button secondary"
          disabled={!result.length}
          onClick={() =>
            download(
              "posdata-destinos-economia.csv",
              csv(
                result.map((r) => ({
                  ...r,
                  institution: institutions[r.institution],
                  source: "https://github.com/pablogguz/econphd_placements",
                  observed: "Historical placement; not current employment",
                  classification: "Original source labels, unverified",
                })),
              ),
            )
          }
        >
          <Download size={17} />
          {t("Descargar resultados", "Download results")}
        </button>
      </PageTitle>
      <div className="editorial-note">
        <MapPin size={22} />
        <p>
          {t(
            "Los nombres de empleadores abren posibilidades concretas. Esta colección no representa todas las disciplinas ni todos los doctorados en Economía, y no acredita el empleo actual.",
            "Employer names reveal specific possibilities. This collection does not represent all disciplines or all economics doctorates, and does not establish current employment.",
          )}
        </p>
      </div>
      {!data ? (
        <Loading error={error} reload={reload} lang={l} />
      ) : (
        <>
          <div className="filter-bar">
            <SearchBox
              value={q}
              set={sq}
              label={t("Buscar destinos", "Search placements")}
              placeholder={t(
                "Empresa, universidad, persona o campo…",
                "Employer, university, person or field…",
              )}
            />
            <label className="sr-only" htmlFor="placement-inst">
              {t("Universidad de origen", "Origin university")}
            </label>
            <select
              id="placement-inst"
              value={inst}
              onChange={(e) => si(e.target.value)}
            >
              <option value="">
                {t("Todos los departamentos", "All departments")}
              </option>
              {Object.entries(institutions).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="placement-type">
              {t("Tipo de destino", "Placement type")}
            </label>
            <select
              id="placement-type"
              value={type}
              onChange={(e) => st(e.target.value)}
            >
              <option value="">{t("Todos los tipos", "All types")}</option>
              {Object.entries(placementTypes).map(([k, v]) => (
                <option key={k} value={k}>
                  {v[l]}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="placement-year">
              {t("Año de destino", "Placement year")}
            </label>
            <select
              id="placement-year"
              value={year}
              onChange={(e) => sy(e.target.value)}
            >
              <option value="">{t("Todos los años", "All years")}</option>
              {[...new Set(data.map((r) => r.year))]
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y}>{y}</option>
                ))}
            </select>
          </div>
          <div className="list-meta">
            <p role="status">
              {number(result.length, l)} {t("registros", "records")} ·{" "}
              {new Set(result.map((r) => r.employer)).size}{" "}
              {t("etiquetas de destino", "destination labels")}
            </p>
            <label>
              {t("Ordenar", "Sort")}{" "}
              <select value={sort} onChange={(e) => ss(e.target.value)}>
                <option value="new">{t("Más recientes", "Newest")}</option>
                <option value="old">{t("Más antiguos", "Oldest")}</option>
                <option value="employer">
                  {t("Destino A–Z", "Destination A–Z")}
                </option>
              </select>
            </label>
            <button className="text-button" onClick={reset}>
              {t("Restablecer", "Reset")}
            </button>
          </div>
          {result.length ? (
            <>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label={t("Tabla desplazable", "Scrollable table")}
              >
                <table className="data-table placement-table">
                  <caption className="sr-only">
                    {t(
                      "Registros de destinos de Economía",
                      "Economics placement records",
                    )}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t("Año", "Year")}</th>
                      <th>{t("Destino publicado", "Reported destination")}</th>
                      <th>
                        {t("Departamento de origen", "Origin department")}
                      </th>
                      <th>{t("Persona / campo", "Person / field")}</th>
                      <th>{t("Etiqueta original²", "Original label²")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.slice(page * 25, page * 25 + 25).map((r) => (
                      <tr key={r.id}>
                        <td>{r.year}</td>
                        <th>{r.employer}</th>
                        <td>{institutions[r.institution]}</td>
                        <td>
                          {r.name ||
                            t("Nombre no publicado", "Name not published")}
                          <small>
                            {r.field ||
                              t(
                                "Subcampo no disponible",
                                "Subfield unavailable",
                              )}
                          </small>
                        </td>
                        <td>
                          <span className="type-label">
                            {placementTypes[r.type]?.[l] || r.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                set={sp}
                total={result.length}
                size={25}
                lang={l}
              />
            </>
          ) : (
            <Empty lang={l} reset={reset} />
          )}
          <details className="data-note">
            <summary>
              <Info size={16} />
              {t(
                "Leer antes de usar estos registros",
                "Read before using these records",
              )}
            </summary>
            <p>
              {t(
                "¹ La fuente usa “tenure_track” en 3.438 registros. Aquí se muestra como puesto académico: no hemos verificado la estabilidad del contrato. ² Conservamos las categorías de origen, que contienen errores de clasificación (por ejemplo, algunos bancos centrales figuran como privado).",
                "¹ The source labels 3,438 records “tenure_track”. We show academic position: contract stability has not been verified. ² Source categories contain classification errors (for example, some central banks are labelled private).",
              )}
            </p>
            <p>
              {t(
                "1.739 registros no tienen nombre; 4.599 no tienen subcampo principal. No se eliminan filas idénticas de graduados sin nombre: podrían ser personas distintas. Las etiquetas de empleador no están normalizadas a entidades únicas.",
                "1,739 records lack a name; 4,599 lack a primary subfield. Identical anonymous rows are retained because they could represent different people. Employer labels are not normalised to unique organisations.",
              )}
            </p>
            <p>
              {t(
                "Histórico 1998–2023. El campo “region” de origen corresponde al departamento, no al país del empleo. La exportación conserva la etiqueta original y su procedencia.",
                "Historical records, 1998–2023. The original “region” field refers to the department, not the employment country. Exports preserve original labels and provenance.",
              )}
            </p>
          </details>
          <div className="result-actions">
            <SourceLink url="https://github.com/pablogguz/econphd_placements">
              Pablo Guzmán · econphd_placements
            </SourceLink>
            <a href={`${import.meta.env.BASE_URL}data/econ-license.txt`}>
              {t("Licencia MIT y atribución", "MIT licence & attribution")}
            </a>
          </div>
        </>
      )}
    </>
  );
}
function Pagination({
  page,
  set,
  total,
  size,
  lang: l,
}: {
  page: number;
  set: (x: number) => void;
  total: number;
  size: number;
  lang: Lang;
}) {
  const pages = Math.ceil(total / size);
  return (
    <div className="pagination">
      <button
        className="button secondary"
        disabled={page === 0}
        onClick={() => set(page - 1)}
      >
        <ArrowLeft size={16} />
        {l === "es" ? "Anterior" : "Previous"}
      </button>
      <span aria-live="polite">
        {l === "es" ? "Página" : "Page"} {page + 1} / {pages}
      </span>
      <button
        className="button secondary"
        disabled={page >= pages - 1}
        onClick={() => set(page + 1)}
      >
        {l === "es" ? "Siguiente" : "Next"}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Careers({
  lang: l,
  navigate,
}: {
  lang: Lang;
  navigate: (v: State["view"]) => void;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [sector, setSector] = useState(0);
  const [q, sq] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("posdata-pathways") || "[]");
    } catch {
      return [];
    }
  });
  const [onlySaved, so] = useState(false);
  const toggle = (id: string) =>
    setSaved((s) => {
      const n = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      try {
        localStorage.setItem("posdata-pathways", JSON.stringify(n));
      } catch {
        /* Optional personal shortlist must not block reading. */
      }
      return n;
    });
  const result = careers.filter(
    (c) =>
      (!sector || c.sector === sector) &&
      (!onlySaved || saved.includes(c.id)) &&
      norm(c.title[l] + " " + c.description[l] + " " + c.skills[l]).includes(
        norm(q),
      ),
  );
  return (
    <>
      <PageTitle
        title={t("Tu experiencia puede viajar.", "Your experience can travel.")}
        description={t(
          "18 funciones para explorar. Orientación editorial apoyada en estudios; no son vacantes ni probabilidades de contratación.",
          "18 functions to explore. Research-informed editorial guidance, not vacancies or hiring probabilities.",
        )}
      />
      <div className="career-intro">
        <h2>
          {t(
            "Empieza por lo que quieres hacer.",
            "Start with what you want to do.",
          )}
        </h2>
        <p>
          {t(
            "Investigar, enseñar, construir, evaluar, comunicar. Un mismo trabajo puede existir en varios sectores. Estas descripciones son puntos de partida: consulta requisitos concretos de cada puesto y país.",
            "Research, teach, build, evaluate, communicate. The same work can exist across sectors. These descriptions are starting points: check the requirements of each role and country.",
          )}
        </p>
      </div>
      <div className="filter-bar">
        <SearchBox
          value={q}
          set={sq}
          label={t("Buscar funciones", "Search functions")}
          placeholder={t(
            "Comunicación, datos, cultura…",
            "Communication, data, culture…",
          )}
        />
        <button
          className={`button ${onlySaved ? "" : "secondary"}`}
          aria-pressed={onlySaved}
          onClick={() => so((v) => !v)}
        >
          <Check size={16} />
          {t("Mi selección", "My shortlist")} ({saved.length})
        </button>
        {saved.length > 0 && (
          <button
            className="text-button"
            onClick={() =>
              download(
                "posdata-mis-opciones.txt",
                careers
                  .filter((c) => saved.includes(c.id))
                  .map(
                    (c) =>
                      `${c.title[l]}\n${c.description[l]}\n${c.skills[l]}\n${studies.find((s) => s.id === c.study)?.url}\n`,
                  )
                  .join("\n"),
                "text/plain;charset=utf-8",
              )
            }
          >
            <Download size={16} />
            {t("Guardar lista", "Save list")}
          </button>
        )}
      </div>
      <div className="filter-tabs">
        {sectors.map((s, i) => (
          <button
            key={s.en}
            aria-pressed={sector === i}
            onClick={() => setSector(i)}
          >
            {s[l]}
          </button>
        ))}
      </div>
      <div className="career-list">
        {result.map((c) => {
          const evidence = studies.find((s) => s.id === c.study)!;
          return (
            <article key={c.id}>
              <div className="career-number">
                <GitBranch size={26} />
                <span>{sectors[c.sector][l]}</span>
              </div>
              <div>
                <h2>{c.title[l]}</h2>
                <p>{c.description[l]}</p>
                <div className="skills">
                  <span>
                    {t("Habilidades transferibles", "Transferable skills")}
                  </span>
                  {c.skills[l]}
                </div>
                <SourceLink url={evidence.url}>
                  {t(
                    "Contexto para explorar esta vía",
                    "Context for exploring this path",
                  )}{" "}
                  · {evidence.author}
                </SourceLink>
              </div>
              <button
                className={`save-button ${saved.includes(c.id) ? "saved" : ""}`}
                aria-label={`${saved.includes(c.id) ? t("Quitar", "Remove") : t("Añadir", "Add")} ${c.title[l]}`}
                aria-pressed={saved.includes(c.id)}
                onClick={() => toggle(c.id)}
              >
                {saved.includes(c.id) ? (
                  <Check size={19} />
                ) : (
                  <Plus size={19} />
                )}
              </button>
            </article>
          );
        })}
      </div>
      {!result.length && (
        <Empty
          lang={l}
          reset={() => {
            sq("");
            setSector(0);
            so(false);
          }}
        />
      )}
      <p className="small-note">
        {t(
          "Tu selección se guarda solo en este navegador. No se envía a ningún servidor. Las habilidades son síntesis editorial, no resultados cuantitativos del estudio enlazado.",
          "Your shortlist is stored only in this browser. It is not sent to a server. Skills are editorial synthesis, not quantitative findings of the linked study.",
        )}
      </p>
      <button className="text-button" onClick={() => navigate("studies")}>
        <BookOpen size={17} />
        {t(
          "Ver toda la biblioteca de estudios",
          "See the full research library",
        )}
      </button>
    </>
  );
}

function Studies({ lang: l }: { lang: Lang }) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const [q, sq] = useState("");
  const [tag, st] = useState("");
  const tags = [...new Set(studies.flatMap((s) => s.tags))];
  const result = studies.filter(
    (s) =>
      (!tag || s.tags.includes(tag)) &&
      norm(s.title + " " + s.author + " " + s.finding[l]).includes(norm(q)),
  );
  return (
    <>
      <PageTitle
        title={t(
          "La evidencia detrás del mapa.",
          "The evidence behind the map.",
        )}
        description={t(
          "Estudios, seguimientos y marcos metodológicos para entender las carreras doctorales.",
          "Studies, follow-ups and methodological frameworks for understanding doctoral careers.",
        )}
      >
        <button
          className="button secondary"
          disabled={!result.length}
          onClick={() =>
            download(
              "posdata-bibliografia.bib",
              result
                .map(
                  (s) =>
                    `@misc{${s.id},\n  title = {${s.title}},\n  author = {${s.author}},\n  year = {${s.year}},\n  url = {${s.url}},\n  note = {Publication or reference year; see source for bibliographic metadata}\n}`,
                )
                .join("\n\n"),
              "application/x-bibtex",
            )
          }
        >
          <Download size={17} />
          BibTeX
        </button>
      </PageTitle>
      <div className="filter-bar">
        <SearchBox
          value={q}
          set={sq}
          label={t("Buscar estudios", "Search studies")}
          placeholder={t(
            "Pregunta, autor o palabra clave…",
            "Question, author or keyword…",
          )}
        />
        <label className="sr-only" htmlFor="study-topic">
          {t("Tema", "Topic")}
        </label>
        <select
          id="study-topic"
          value={tag}
          onChange={(e) => st(e.target.value)}
        >
          <option value="">{t("Todos los temas", "All topics")}</option>
          {tags.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <span className="result-count" role="status">
          {result.length} {t("lecturas", "readings")}
        </span>
      </div>
      <div className="studies-list">
        {result.map((s) => (
          <article key={s.id}>
            <div className="study-year">
              {s.year}
              <span>{s.tags.join(" / ")}</span>
            </div>
            <div>
              <p className="study-author">{s.author}</p>
              <h2>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                  <ArrowUpRight size={19} />
                </a>
              </h2>
              <p className="study-finding">{s.finding[l]}</p>
              <details>
                <summary>
                  {t(
                    "Muestra, alcance y cómo usarlo",
                    "Sample, scope and how to use it",
                  )}
                  <ChevronDown size={15} />
                </summary>
                <p>{s.scope[l]}</p>
                <p>{s.use[l]}</p>
                <SourceLink url={s.url}>
                  {t("Leer la fuente primaria", "Read the primary source")}
                </SourceLink>
              </details>
            </div>
          </article>
        ))}
      </div>
      {!result.length && (
        <Empty
          lang={l}
          reset={() => {
            sq("");
            st("");
          }}
        />
      )}
      <p className="small-note">
        {t(
          "Síntesis originales breves. Los años de los proyectos continuos son años de referencia, no fechas de un artículo. Los títulos y las citas conservan el idioma original.",
          "Brief original summaries. Dates for ongoing projects are reference years, not article publication dates. Titles and citations retain their original language.",
        )}
      </p>
    </>
  );
}

function Sources({
  lang: l,
  navigate,
}: {
  lang: Lang;
  navigate: (v: State["view"]) => void;
}) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const { data, error, reload } = useData<Source[]>("sources.json");
  const [q, sq] = useState("");
  const [priority, sp] = useState("");
  const result =
    data?.filter(
      (s) =>
        (!priority || s.prioridad === priority) &&
        norm(Object.values(s).join(" ")).includes(norm(q)),
    ) || [];
  return (
    <>
      <PageTitle
        title={t(
          "Cada dato tiene un origen.",
          "Every data point has an origin.",
        )}
        description={t(
          "75 fuentes y recursos investigados. Un directorio global, con accesibilidad, cobertura y límites.",
          "75 researched sources and resources. A global directory with access, coverage and limitations.",
        )}
      >
        <a
          className="button secondary"
          href={`${import.meta.env.BASE_URL}data/sources.csv`}
          download
        >
          <Download size={17} />
          {t("Catálogo CSV", "CSV catalogue")}
        </a>
      </PageTitle>
      <div className="coverage-strip">
        <div>
          <strong>
            {t("Integrado en el visor", "Integrated in the explorer")}
          </strong>
          <span>ORCID · ROR · NCSES · IP Doc · LEO</span>
        </div>
        <div>
          <strong>{t("Destinos documentados", "Documented placements")}</strong>
          <span>
            ORCID · Oxford · Glasgow · Cattolica ·{" "}
            {t("archivo de Economía", "Economics archive")}
          </span>
        </div>
        <button className="text-button" onClick={() => navigate("methods")}>
          {t("Método y taxonomía", "Methods & taxonomy")}
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="small-note">
        {t(
          "El directorio es más amplio que los datos integrados. Incluye fuentes históricas, accesos restringidos y recursos para enlazar identidades. No son 75 bases ya extraídas ni una cobertura censal mundial.",
          "The directory extends beyond the integrated data. It includes historical sources, restricted access and identity-linking resources. These are not 75 fully extracted databases or a worldwide census.",
        )}
      </p>
      {!data ? (
        <Loading error={error} reload={reload} lang={l} />
      ) : (
        <>
          <div className="filter-bar">
            <SearchBox
              value={q}
              set={sq}
              label={t("Buscar fuentes", "Search sources")}
              placeholder={t(
                "País, disciplina, API, ORCID…",
                "Country, discipline, API, ORCID…",
              )}
            />
            <label className="sr-only" htmlFor="priority">
              {t("Prioridad", "Priority")}
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => sp(e.target.value)}
            >
              <option value="">
                {t("Todas las prioridades", "All priorities")}
              </option>
              {[...new Set(data.map((s) => s.prioridad))].sort().map((x) => (
                <option value={x} key={x}>
                  {x}{" "}
                  {x === "A"
                    ? t("· base principal", "· primary foundation")
                    : ""}
                </option>
              ))}
            </select>
            <span role="status">
              {result.length} {t("fuentes", "sources")}
            </span>
          </div>
          <div className="sources-list">
            {result.map((s) => (
              <details key={s.id}>
                <summary>
                  <span className="source-index">{s.id}</span>
                  <div>
                    <h2>{s.fuente}</h2>
                    <p>{s.ambito}</p>
                  </div>
                  <span className="priority">{s.prioridad}</span>
                  <ChevronDown size={18} />
                </summary>
                <div className="source-detail">
                  <dl>
                    {[
                      [t("Qué aporta", "What it provides"), s.aporte],
                      [t("Acceso", "Access"), s.acceso],
                      [t("Vigencia", "Currency"), s.vigencia],
                      [t("Límites", "Limits"), s.limite],
                      [t("Reutilización", "Reuse"), s.reutilizacion],
                      [t("Verificación", "Verification"), s.verificacion],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <SourceLink url={s.url}>
                    {t("Abrir fuente", "Open source")}
                  </SourceLink>
                </div>
              </details>
            ))}
          </div>
          {!result.length && (
            <Empty
              lang={l}
              reset={() => {
                sq("");
                sp("");
              }}
            />
          )}
        </>
      )}
    </>
  );
}

function Tables({ lang: l }: { lang: Lang }) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  const { data, error, reload } = useData<DataTable[]>("tables.json");
  const [q, sq] = useState("");
  const [source, ss] = useState("");
  const [selected, st] = useState<DataTable | null>(null);
  const [page, sp] = useState(0);
  const [kind, sk] = useState("official");
  useEffect(() => sp(0), [q, source]);
  const result =
    data?.filter(
      (r) =>
        (!source || r.source === source) &&
        norm(r.title + " " + r.id).includes(norm(q)),
    ) || [];
  return (
    <>
      <PageTitle
        title={t("Abre los datos.", "Open the data.")}
        description={t(
          "196 tablas oficiales completas y datos institucionales franceses. Conservamos los encabezados y las celdas suprimidas.",
          "196 complete official tables and French institutional data. Original headings and suppressed cells are preserved.",
        )}
      />
      <div className="filter-tabs">
        <button
          aria-pressed={kind === "official"}
          onClick={() => sk("official")}
        >
          {t("Tablas NCSES", "NCSES tables")}
        </button>
        <button aria-pressed={kind === "france"} onClick={() => sk("france")}>
          {t("Universidades francesas", "French universities")}
        </button>
        <a href={`${import.meta.env.BASE_URL}data/datasets.json`} download>
          <Download size={15} />
          {t("Datos del visor · JSON", "Explorer data · JSON")}
        </a>
      </div>
      {kind === "france" ? (
        <FrenchInstitutions lang={l} />
      ) : selected ? (
        <>
          <button className="text-button" onClick={() => st(null)}>
            <ArrowLeft size={16} />
            {t("Volver a las tablas", "Back to tables")}
          </button>
          <RawTable table={selected} lang={l} />
        </>
      ) : !data ? (
        <Loading error={error} reload={reload} lang={l} />
      ) : (
        <>
          <div className="filter-bar">
            <SearchBox
              value={q}
              set={sq}
              label={t("Buscar tablas", "Search tables")}
              placeholder={t(
                "salary, employment, field, postdoc…",
                "salary, employment, field, postdoc…",
              )}
            />
            <label className="sr-only" htmlFor="table-source">
              {t("Encuesta", "Survey")}
            </label>
            <select
              id="table-source"
              value={source}
              onChange={(e) => ss(e.target.value)}
            >
              <option value="">{t("Ambas encuestas", "Both surveys")}</option>
              <option>SED 2024</option>
              <option>SDR 2023</option>
            </select>
            <span role="status">
              {result.length} {t("tablas", "tables")}
            </span>
          </div>
          <div className="table-directory">
            {result.slice(page * 20, page * 20 + 20).map((r) => (
              <article key={r.id}>
                <span>
                  {r.source}
                  <small>
                    {r.id.replace(/^nsf\d+-tab/, "Table ").replaceAll("-", "–")}
                  </small>
                </span>
                <h2>
                  <button onClick={() => st(r)}>
                    {r.title}
                    <ArrowRight size={18} />
                  </button>
                </h2>
                <SourceLink url={r.url}>Excel</SourceLink>
              </article>
            ))}
          </div>
          {result.length ? (
            <Pagination
              page={page}
              set={sp}
              total={result.length}
              size={20}
              lang={l}
            />
          ) : (
            <Empty
              lang={l}
              reset={() => {
                sq("");
                ss("");
              }}
            />
          )}
        </>
      )}
    </>
  );
}
function RawTable({ table, lang: l }: { table: DataTable; lang: Lang }) {
  const { data, error, reload } = useData<{
    rows: (string | number | null)[][];
  }>(`tables/${table.id}.json`);
  return (
    <section className="raw-table">
      <h2>{table.title}</h2>
      <div className="result-actions">
        <p>
          {table.source} ·{" "}
          {l === "es"
            ? "Encabezados originales; D/S/NA conservados. Consulta notas en la fuente."
            : "Original headings; D/S/NA preserved. Consult notes at source."}
        </p>
        <SourceLink url={table.url}>
          {l === "es" ? "Descargar Excel original" : "Download original Excel"}
        </SourceLink>
      </div>
      {!data ? (
        <Loading error={error} reload={reload} lang={l} />
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          aria-label={
            l === "es"
              ? "Tabla desplazable horizontalmente"
              : "Horizontally scrollable table"
          }
        >
          <table className="data-table original-table">
            <caption className="sr-only">{table.title}</caption>
            <tbody>
              {data.rows.slice(3).map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) =>
                    j === 0 ? (
                      <th key={j}>{v ?? ""}</th>
                    ) : (
                      <td key={j}>
                        {typeof v === "number"
                          ? number(v, l, Number.isInteger(v) ? 0 : 1)
                          : (v ?? "")}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
function FrenchInstitutions({ lang: l }: { lang: Lang }) {
  const { data, error, reload } = useData<
    Record<string, string | number | null>[]
  >("france-institutions.json");
  const [q, sq] = useState("");
  const [year, sy] = useState("2016");
  const [horizon, sh] = useState("36");
  const [page, sp] = useState(0);
  const t = (es: string, en: string) => (l === "es" ? es : en);
  useEffect(() => sp(0), [q, year, horizon]);
  const rows =
    data?.filter(
      (r) =>
        r.annee === year &&
        String(r.situation).startsWith(horizon) &&
        norm(
          `${r.uo_lib_courant} ${r.lib_etablissement_2014} ${r.disca}`,
        ).includes(norm(q)),
    ) || [];
  return (
    <>
      <p className="small-note">
        {t(
          "1.010 observaciones originales. Cada fila corresponde a una universidad, área, cohorte y horizonte; no sumes los agregados entre sí. “nd” indica no disponible.",
          "1,010 original observations. Each row is a university, field, cohort and horizon; do not sum overlapping aggregates. “nd” means unavailable.",
        )}
      </p>
      <div className="filter-bar">
        <SearchBox
          value={q}
          set={sq}
          label={t("Buscar universidad francesa", "Search French university")}
          placeholder={t("Universidad o área…", "University or field…")}
        />
        <label>
          {t("Cohorte", "Cohort")}
          <select value={year} onChange={(e) => sy(e.target.value)}>
            <option>2016</option>
            <option>2014</option>
          </select>
        </label>
        <label>
          {t("Meses después", "Months later")}
          <select value={horizon} onChange={(e) => sh(e.target.value)}>
            <option>36</option>
            <option>12</option>
          </select>
        </label>
        <button
          className="text-button"
          disabled={!rows.length}
          onClick={() =>
            download(
              "posdata-francia-universidades.csv",
              csv(
                rows.map((r) => ({
                  ...r,
                  source:
                    "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-insertion-professionnelle-des-diplomes-doctorat-par-etablissement/",
                })),
              ),
            )
          }
        >
          <Download size={16} />
          CSV ({rows.length})
        </button>
      </div>
      {!data ? (
        <Loading error={error} reload={reload} lang={l} />
      ) : rows.length ? (
        <>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t("Tabla desplazable", "Scrollable table")}
          >
            <table className="data-table">
              <caption>
                {t("Resultados por universidad", "Results by university")}
              </caption>
              <thead>
                <tr>
                  {[
                    "Universidad / University",
                    "Área / Field",
                    "n",
                    "Inserción %",
                    "Estable %",
                    "Academia %",
                    "Neto mensual €",
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(page * 25, page * 25 + 25).map((r, i) => (
                  <tr key={i}>
                    <th>{r.uo_lib_courant || r.lib_etablissement_2014}</th>
                    {[
                      "disca",
                      "eff_rep",
                      "taux_insertion",
                      "part_stable",
                      "part_secteur_academique",
                      "sal_net_med_mensuel",
                    ].map((k) => (
                      <td key={k}>{r[k] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            set={sp}
            total={rows.length}
            size={25}
            lang={l}
          />
        </>
      ) : (
        <Empty lang={l} reset={() => sq("")} />
      )}
      <SourceLink url="https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-insertion-professionnelle-des-diplomes-doctorat-par-etablissement/">
        IP Doc · {t("fuente y definiciones", "source & definitions")}
      </SourceLink>
    </>
  );
}
function Methods({ lang: l }: { lang: Lang }) {
  const t = (es: string, en: string) => (l === "es" ? es : en);
  return (
    <>
      <PageTitle
        title={t(
          "Una brújula, no una predicción.",
          "A compass, not a prediction.",
        )}
        description={t(
          "Qué mide Posdata, qué no mide y cómo están organizadas las categorías.",
          "What Posdata measures, what it does not, and how categories are organised.",
        )}
      />
      <div className="methods">
        <section>
          <h2>
            {t(
              "De un doctorado a un empleo: reglas de inclusión",
              "From doctorate to employment: inclusion rules",
            )}
          </h2>
          <p>
            {t(
              "El explorador principal usa el archivo público completo de ORCID del 1 de octubre de 2025. Solo incluye un perfil cuando declara un doctorado de investigación terminado con fecha y un empleo cuyo inicio es igual o posterior. Los doctorados en curso, honoríficos, títulos profesionales no identificados como PhD, empleos sin fecha y puestos claramente anteriores no califican. Si faltan meses o días dentro del mismo período, conservamos la incertidumbre del orden.",
              "The main explorer uses the complete ORCID public file dated 1 October 2025. A profile qualifies only when it states a completed, dated research doctorate and a job starting at or after it. Ongoing or honorary degrees, professional degrees not identified as PhDs, undated jobs and clearly earlier jobs do not qualify. Missing months or days within the same period leave the order uncertain.",
            )}
          </p>
          <p>
            {t(
              "Una fila representa un identificador ORCID, no una persona independientemente verificada. Se toma el primer doctorado terminado y se permite elegir el primer empleo posterior observado o el último inicio registrado. El historial conserva puestos simultáneos. Nada de ello certifica empleo actual, estabilidad contractual o una secuencia exhaustiva.",
              "One row represents an ORCID identifier, not an independently verified person. We use the earliest completed doctorate and allow selection of the first observed later job or the latest recorded start. The history retains concurrent roles. This does not certify current employment, contract stability or an exhaustive sequence.",
            )}
          </p>
          <p>
            {t(
              "Las áreas se asignan mediante reglas multilingües sobre el título y departamento del doctorado; son categorías de navegación, no códigos FORD o ISCED validados. ROR clasifica el sector de la organización por ID, enlace GRID o un nombre y país exactos y únicos. No sustituimos el país declarado del empleo por la sede de la empresa. La función procede del título del puesto. Se conservan áreas múltiples y categorías sin identificar.",
              "Fields use multilingual rules on the doctoral degree and department; these are browsing categories, not validated FORD or ISCED codes. ROR supplies organisation sector through an ID, GRID crosswalk or a unique exact name and country. The reported employment country is never replaced by company headquarters. Function comes from the job title. Multiple fields and unknown categories are retained.",
            )}
          </p>
          <p>
            {t(
              "La selección voluntaria de ORCID favorece a quienes siguen vinculados a investigación. Los porcentajes solo describen los perfiles filtrados. Las 295 fichas universitarias se muestran por separado: pueden solaparse con ORCID y sus nombramientos pueden ser históricos o futuros. Ausencia de un registro nunca significa desempleo.",
              "Voluntary ORCID profiles favour people who remain connected to research. Percentages describe only the filtered profiles. The 295 university entries are displayed separately: they may overlap ORCID and appointments may be historical or future. An absent record never means unemployment.",
            )}
          </p>
          <a
            href={`${import.meta.env.BASE_URL}data/trajectories/manifest.json`}
            download
          >
            {t(
              "Descargar manifiesto de trayectorias y huellas de los archivos",
              "Download the career manifest and file checksums",
            )}
          </a>
        </section>
        <section>
          <h2>
            {t("Encuestas que aportan contexto", "Surveys providing context")}
          </h2>
          <dl className="method-ledger">
            <div>
              <dt>SED</dt>
              <dd>
                {t(
                  "¿Qué compromiso tiene alguien al terminar? Doctorados de investigación en todas las disciplinas. No es su empleo real cinco años después.",
                  "What commitment does someone have at graduation? Research doctorates across all disciplines. Not actual employment five years later.",
                )}
              </dd>
            </div>
            <div>
              <dt>SDR</dt>
              <dd>
                {t(
                  "¿Dónde trabajan las personas doctoradas en ciencias, ingeniería y salud? Una encuesta ponderada, con varias generaciones reunidas.",
                  "Where do science, engineering and health doctorate holders work? A weighted survey covering several generations.",
                )}
              </dd>
            </div>
            <div>
              <dt>IP Doc</dt>
              <dd>
                {t(
                  "¿Cómo se insertó una cohorte francesa al año y a los tres años? Empleo, sector, estabilidad y salario.",
                  "How did a French cohort enter the labour market after one and three years? Employment, sector, stability and pay.",
                )}
              </dd>
            </div>
            <div>
              <dt>LEO</dt>
              <dd>
                {t(
                  "¿Qué actividad e ingresos se observan en registros enlazados? Doctorados de proveedores ingleses, con domicilio previo en Reino Unido.",
                  "What activity and earnings appear in linked records? Doctorates from English providers, previously UK-domiciled.",
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>
            {t(
              "Una taxonomía en seis dimensiones",
              "A taxonomy in six dimensions",
            )}
          </h2>
          <p>
            {t(
              "Preservamos las categorías de cada fuente. No forzamos equivalencias entre clases que miden cosas diferentes. El explorador de trayectorias separa:",
              "We retain each source’s categories. We do not force equivalence between classes measuring different things. The career explorer separates:",
            )}
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t("Tabla desplazable", "Scrollable table")}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Dimensión", "Dimension")}</th>
                  <th>{t("Ejemplos", "Examples")}</th>
                  <th>{t("Qué evita confundir", "What it distinguishes")}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    t("Disciplina", "Discipline"),
                    t(
                      "ISCED-F / FORD; subcampo de la fuente",
                      "ISCED-F / FORD; source subfield",
                    ),
                    t(
                      "Área del doctorado frente a área del empleo",
                      "Doctoral field versus employment field",
                    ),
                  ],
                  [
                    t("Sector", "Sector"),
                    t(
                      "Universidad, empresa, gobierno, ONG",
                      "University, business, government, nonprofit",
                    ),
                    t(
                      "Tipo de organización frente a tareas",
                      "Organisation type versus tasks",
                    ),
                  ],
                  [
                    t("Función", "Function"),
                    t(
                      "I+D, docencia, datos, gestión, comunicación",
                      "R&D, teaching, data, management, communication",
                    ),
                    t(
                      "Trabajar en una universidad frente a investigar",
                      "Working at a university versus researching",
                    ),
                  ],
                  [
                    t("Etapa y contrato", "Stage & contract"),
                    t(
                      "Postdoc, temporal, estable, autoempleo",
                      "Postdoc, temporary, permanent, self-employed",
                    ),
                    t(
                      "Un postdoc frente a un sector económico",
                      "A postdoc versus an economic sector",
                    ),
                  ],
                  [
                    t("Geografía", "Geography"),
                    t(
                      "País del título, país de trabajo",
                      "Degree country, work country",
                    ),
                    t(
                      "Formación en un país frente a empleo allí",
                      "Training in a country versus working there",
                    ),
                  ],
                  [
                    t("Tiempo y evidencia", "Time & evidence"),
                    t(
                      "Cohorte, observación, fuente, confianza",
                      "Cohort, observation, source, confidence",
                    ),
                    t(
                      "Primer destino frente a empleo actual",
                      "First placement versus current work",
                    ),
                  ],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((x, i) =>
                      i === 0 ? <th key={i}>{x}</th> : <td key={i}>{x}</td>,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SourceLink url="https://graduate.ucsf.edu/admission/graduate-program-statistics/definitions">
            UCSF / NGLS ·{" "}
            {t("definiciones de referencia", "reference definitions")}
          </SourceLink>
        </section>
        <section>
          <h2>{t("Reglas de lectura", "Reading rules")}</h2>
          <ul>
            <li>
              {t(
                "No sumamos fuentes solapadas para anunciar un total mundial de personas. Una fila agregada no es una persona.",
                "We do not sum overlapping sources into a global headcount. An aggregate row is not a person.",
              )}
            </li>
            <li>
              {t(
                "Ausencia de información no significa desempleo. Una afiliación en OpenAlex no prueba un contrato ni un doctorado.",
                "Missing information does not mean unemployment. An OpenAlex affiliation proves neither a job contract nor a doctorate.",
              )}
            </li>
            <li>
              {t(
                "Los salarios conservan moneda, periodicidad, población y año. No hay conversión de divisas ni ajuste por poder adquisitivo o inflación.",
                "Earnings retain currency, period, population and year. No currency conversion or purchasing-power/inflation adjustment is applied.",
              )}
            </li>
            <li>
              {t(
                "Las celdas suprimidas siguen vacías. No reconstruimos valores confidenciales mediante diferencias entre totales.",
                "Suppressed cells remain missing. Confidential values are not reconstructed from totals.",
              )}
            </li>
            <li>
              {t(
                "Las series con distintos horizontes pueden corresponder a cohortes distintas. No son automáticamente trayectorias longitudinales.",
                "Different horizons may represent different cohorts. They are not automatically longitudinal trajectories.",
              )}
            </li>
          </ul>
        </section>
        <section>
          <h2>
            {t(
              "Cobertura y límites de esta edición",
              "Coverage and limits of this edition",
            )}
          </h2>
          <p>
            {t(
              "Todas las grandes familias de disciplinas están representadas en SED. La profundidad varía por país y área. El directorio amplía el alcance a Europa, América, Asia, África y Oceanía, pero las cuatro colecciones estadísticas integradas proceden de Estados Unidos, Francia e Inglaterra. Las trayectorias nominales parten del archivo ORCID 2025 en todas las disciplinas identificables, con prioridad a doctorados europeos y empleos mundiales. Se añaden listas universitarias y un archivo histórico de Economía, sin sumar sus recuentos.",
              "All broad disciplinary families are represented in SED. Depth varies by country and field. The directory extends to Europe, the Americas, Asia, Africa and Oceania, but the four integrated statistical collections come from the US, France and England. Individual career records use the ORCID 2025 archive across identifiable disciplines, prioritising European doctorates and worldwide employment. University lists and the historical Economics archive are kept as separate evidence, without adding their counts.",
            )}
          </p>
          <p>
            {t(
              "La investigación inicial examinó 241 direcciones web únicas en 45 búsquedas. El catálogo se ha ampliado a 75 fuentes y recursos; 14 lecturas primarias están resumidas en la biblioteca. No afirmamos ser un censo global ni disponer de todos los destinos.",
              "Initial research examined 241 unique web addresses across 45 searches. The directory was expanded to 75 sources and resources; 14 primary readings are summarised in the library. We do not claim a global census or all career destinations.",
            )}
          </p>
        </section>
        <section>
          <h2>
            {t("Reproducibilidad y derechos", "Reproducibility & rights")}
          </h2>
          <p>
            {t(
              "ORCID y ROR se reutilizan bajo CC0 1.0. Los manifiestos incluyen las huellas de los archivos originales y derivados. Cada descarga tiene URL, fecha y huella SHA-256. El repositorio contiene el proceso de extracción. Los agregados NCSES son estadística pública estadounidense; IP Doc usa Licence Ouverte 2.0; LEO usa Open Government Licence v3.0. Los registros de Economía mantienen su licencia MIT y atribución original.",
              "ORCID and ROR are reused under CC0 1.0. Manifests include original and derived file checksums. Every downloaded snapshot has a URL, date and SHA-256 hash. The repository contains the extraction process. NCSES aggregates are US public statistics; IP Doc uses Licence Ouverte 2.0; LEO uses Open Government Licence v3.0. Economics records retain their MIT licence and original attribution.",
            )}
          </p>
          <p>
            {t(
              "Los artículos y recursos enlazados conservan sus propios derechos. Solo publicamos síntesis breves originales; los microdatos restringidos no se redistribuyen.",
              "Linked articles and resources retain their own rights. We publish only brief original summaries; restricted microdata is not redistributed.",
            )}
          </p>
          <div className="result-actions">
            <a href={`${import.meta.env.BASE_URL}data/manifest.json`} download>
              <Download size={16} />
              {t("Manifiesto de fuentes", "Source manifest")}
            </a>
            <SourceLink url="https://github.com/aleetreny/posdata">
              {t("Código y extracción", "Code & extraction")}
            </SourceLink>
          </div>
        </section>
      </div>
    </>
  );
}
