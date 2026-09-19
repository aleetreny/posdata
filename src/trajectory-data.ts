export type Label = { id: string; es: string; en: string };
export type Shard = {
  file: string;
  bytes: number;
  sha256: string;
  records: number;
  group?: string;
};
export type TrajectoryManifest = {
  version: number;
  complete: boolean;
  snapshot: string;
  edition: string;
  counts: Record<string, number>;
  fields: Label[];
  sectors: Label[];
  functions: Label[];
  europe: string[];
  doctoralCountries: Record<string, number>;
  employmentCountries?: Record<string, number>;
  indexes: Shard[];
  details: Shard[];
  organisationMatches: Record<string, number>;
  archive: { counts: Record<string, number>; md5: string; sha256: string };
  sources: {
    id: string;
    title: string;
    url: string;
    license: string;
    snapshot: string;
  }[];
};
export type TrajectoryFilters = {
  origin: string;
  destination: string;
  field: string;
  sector: string;
  role: string;
  q: string;
  searchIn: string;
  employer: string;
  mode: "first" | "last";
  from: string;
  to: string;
  mobility: string;
  page: number;
};
export const defaultFilters: TrajectoryFilters = {
  origin: "europe",
  destination: "",
  field: "",
  sector: "",
  role: "",
  q: "",
  searchIn: "all",
  employer: "",
  mode: "last",
  from: "",
  to: "",
  mobility: "",
  page: 1,
};
export type CareerRow = {
  id: string;
  name: string;
  doctoralOrg: string;
  doctoralCountry: string;
  doctoralYear: number;
  field: number;
  employer: string;
  country: string;
  role: string;
  jobYear: number;
  sector: number;
  roleGroup: number;
  detailShard: number;
  detailOffset: number;
  ambiguous: boolean;
  jobCount: number;
};
export type CareerResults = {
  total: number;
  international: number;
  missingCountry: number;
  unknownSector: number;
  rows: CareerRow[];
  page: number;
  pages: number;
  sectors: [string, number][];
  destinations: [string, number][];
  fields: [string, number][];
  origins: [string, number][];
  organisations: [string, number][];
};
export type Affiliation = {
  organization: string;
  country: string;
  city: string;
  department: string;
  role: string;
  start: number[] | null;
  end: number[] | null;
  updated: string;
  assertion: string;
  sourceName: string;
  classification: {
    sector: number;
    method: string;
    ror: string;
    rorTypes?: string[];
    rorScope?: "parent";
    conflictingRor?: string;
    sectorRule?: string;
  };
};
export type CareerDetail = {
  id: string;
  name: string;
  snapshot: string;
  doctorates: Affiliation[];
  employments: Affiliation[];
  field: number;
  fieldMatches: number[];
};
export type UniversityEntry = {
  name: string;
  doctoralDetail: string;
  appointments: string[];
  source: string;
  institution: string;
  country: string;
  field: string;
  url: string;
  retrieved: string;
};
export type UniversityData = {
  records: UniversityEntry[];
  sources: {
    id: string;
    institution: string;
    records: number;
    url: string;
    note: string;
  }[];
};
export async function fetchCompressed<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const header = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  if (header[0] === 31 && header[1] === 139) {
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text()) as T;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
export const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
