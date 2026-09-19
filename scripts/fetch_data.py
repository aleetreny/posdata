"""Retrieve versioned public-source snapshots. No credentials or personal-profile scraping."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, urllib.request, hashlib, zipfile

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
RAW.mkdir(parents=True, exist_ok=True)
SOURCES = {
 'econ-placements.dta': 'https://raw.githubusercontent.com/pablogguz/econphd_placements/main/0_data/all/scraped_data_proc.dta',
 'sed-2024.zip': 'https://ncses.nsf.gov/pubs/nsf25349/assets/data-tables/nsf25349-data-tables-tables-excels.zip',
 'sdr-2023.zip': 'https://ncses.nsf.gov/pubs/nsf25321/assets/data-tables/nsf25321-data-tables-tables-excels.zip',
 'france-disciplines.json': 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-insertion-professionnelle-doctorat-par-discipline/exports/json',
 'france-institutions.json': 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-insertion-professionnelle-des-diplomes-doctorat-par-etablissement/exports/json',
 'ucsd.html': 'https://economics.ucsd.edu/graduate-program/jobmarket-tab/placement-history.html',
 'econ-license.txt': 'https://raw.githubusercontent.com/pablogguz/econphd_placements/main/LICENSE.md',
 'leo-2023-24.zip': 'https://content.explore-education-statistics.service.gov.uk/api/releases/b018e5c2-81fd-4640-b3f8-cb63633cf3a0/files?fromPage=ReleaseDownloads',
 'leo.html': 'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24',
 'trace-2024.pdf': 'https://www.mcgill.ca/trace/files/trace/trace_transborder_quantitative_report_june_10_2024_final.pdf',
 'aarhus-2025.pdf': 'https://phd.au.dk/fileadmin/phd/Quality_in_PhD_education/Employment_Studies_for_PhD_graduates/PhD_report_2025.pdf',
}

def fetch(item):
 name, url = item
 path = RAW / name
 try:
  if not path.exists():
   req = urllib.request.Request(url, headers={'User-Agent':'Posdata research atlas (public data research)'})
   with urllib.request.urlopen(req, timeout=90) as r:
    data = r.read()
   path.write_bytes(data)
  data = path.read_bytes()
  if name.endswith('.zip'):
   with zipfile.ZipFile(path) as z: z.extractall(RAW / name[:-4])
  result = dict(file=name, url=url, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), retrieved='2026-09-19')
 except Exception as e:
  result = dict(file=name, url=url, error=str(e))
 print(json.dumps(result), flush=True)
 return result

if __name__ == '__main__':
 with ThreadPoolExecutor(max_workers=5) as pool:
  results = list(pool.map(fetch, SOURCES.items()))
 (ROOT/'data/manifest.json').write_text(json.dumps(results,indent=2)+'\n')
