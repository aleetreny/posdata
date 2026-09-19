"""Build small, independently compressed browse/detail shards from public ORCID.

The release gate requires a complete, checksum-verified official archive. --preview
is only for local development while acquisition runs, and stamps complete=false.
"""
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import re
import unicodedata
from parse_orcid import EUROPE, SNAPSHOT, later_job, is_doctorate, completed_doctorate

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/data/trajectories'
RAW = ROOT / 'data/raw'

# This is a transparent browsing taxonomy, not a validated ISCED/FORD coding.
# Rules use the doctoral department and degree only. Multiple hits stay multiple.
FIELDS = [
 ('unknown', 'Área sin identificar', 'Field not identified', r'(?!)'),
 ('biology', 'Biología y biomedicina', 'Biology & biomedicine', r'\b(biolog\w*|biomed\w*|biochem\w*|bioquim\w*|biophys\w*|biofis\w*|genetic\w*|genetique|molecular\w*|neurosci\w*|neurocien\w*|biotechnol\w*|biotecnol\w*|immunol\w*|imunol\w*|virol\w*|zoolog\w*|botan\w*|microbiol\w*|bioinformat\w*)\b'),
 ('health', 'Medicina y salud', 'Medicine & health', r'\b(medic\w*|health|sante|salud|saude|nurs\w*|enferm\w*|pharmac\w*|farmac\w*|clinical|clinique|clinic\w*|epidemiol\w*|dentist\w*|odontol\w*|public health|patholog\w*|patolog\w*|oncolog\w*|physiotherap\w*|fisioter\w*)\b'),
 ('chemistry', 'Química', 'Chemistry', r'\b(chemistry|chemical sciences|chimie|chimica|quimica|chemie|analytical chemistry|polymer science)\b'),
 ('physics', 'Física y astronomía', 'Physics & astronomy', r'\b(physics|physique|fisica|physik|astronom\w*|astroph\w*|astrofis\w*|optics|foton\w*|photon\w*)\b'),
 ('math', 'Matemáticas y estadística', 'Mathematics & statistics', r'\b(mathemat\w*|matemat\w*|maths|statistics|statistique\w*|estadistica|estatistica|stochast\w*)\b'),
 ('computing', 'Informática y datos', 'Computing & data', r'\b(computer science|computing|informat\w*|computation\w*|computacion|computacao|data science|machine learning|artificial intelligence|inteligencia artificial|software|cyber\w*)\b'),
 ('engineering', 'Ingeniería y materiales', 'Engineering & materials', r'\b(engineer\w*|ingenier\w*|ingenieur\w*|engenharia|ingegneria|technolog\w*|tecnolog\w*|materials? science|ciencia\w* de materiales|robotic\w*|electronics|microelectron\w*|nanotechnol\w*|telecommun\w*|architecture|arquitectura|bauingen\w*)\b'),
 ('earth', 'Tierra y medioambiente', 'Earth & environment', r'\b(geolog\w*|geophys\w*|geofis\w*|geoscien\w*|earth science\w*|environment\w*|ambiental\w*|ecolog\w*|ocean\w*|climat\w*|atmospheric|geograph\w*|geograf\w*|hydrolog\w*|hydrogeolog\w*|meteorolog\w*)\b'),
 ('agriculture', 'Agricultura y veterinaria', 'Agriculture & veterinary', r'\b(agricult\w*|agronom\w*|veterinar\w*|forestry|food science\w*|ciencia\w* de los alimentos|animal science\w*|horticult\w*)\b'),
 ('psychology', 'Psicología', 'Psychology', r'\b(psycholog\w*|psicolog\w*|cognitive science\w*)\b'),
 ('economics', 'Economía', 'Economics', r'\b(economics|economia|economie|economic science\w*|econometr\w*|volkswirtschaft\w*)\b'),
 ('business', 'Empresa y finanzas', 'Business & finance', r'\b(business|management|finance|finanzas|financas|marketing|accounting|comptabil\w*|contabil\w*|administracao|administracion de empresas|gestao|betriebswirtschaft\w*)\b'),
 ('social', 'Sociedad y política', 'Society & politics', r'\b(sociolog\w*|social science\w*|ciencias sociales|politic\w*|politique\w*|anthropol\w*|antropol\w*|international relations|relaciones internacionales|public policy|social work|communication\w*|comunicacion|comunicacao|demograph\w*|demograf\w*)\b'),
 ('law', 'Derecho', 'Law', r'\b(law|legal studies|derecho|direito|droit|giurisprudenza|rechtswissenschaft\w*|jurisprudence)\b'),
 ('education', 'Educación', 'Education', r'\b(education\w*|educacion|educacao|pedagog\w*|didact\w*)\b'),
 ('history', 'Historia y arqueología', 'History & archaeology', r'\b(history|histoire|historia|historical|archaeolog\w*|arqueolog\w*|geschichte)\b'),
 ('philosophy', 'Filosofía y religión', 'Philosophy & religion', r'\b(philosophy|philosophie|filosof\w*|theolog\w*|teolog\w*|religio\w*|ethics)\b'),
 ('languages', 'Lenguas y literatura', 'Languages & literature', r'\b(linguist\w*|literatur\w*|literary|philolog\w*|filolog\w*|english|modern languages|classics|translation studies)\b'),
 ('arts', 'Arte y humanidades', 'Arts & humanities', r'\b(arts|fine art|bellas artes|humanit\w*|humanidad\w*|humanidades|music\w*|design|diseno|cinema|film studies|theatre|teatro|performance studies)\b'),
 ('multiple', 'Varias áreas declaradas', 'Multiple fields stated', r'(?!)'),
]
SECTORS = [
 ('unknown','Sector sin identificar','Sector not identified'),
 ('education','Universidades y educación','Universities & education'),
 ('company','Empresas','Companies'),
 ('government','Organismos públicos','Government organisations'),
 ('healthcare','Hospitales y salud','Hospitals & health'),
 ('nonprofit','Entidades sin ánimo de lucro','Non-profit organisations'),
 ('facility','Instalaciones de investigación','Research facilities'),
 ('other','Otras organizaciones','Other organisations'),
]
FUNCTIONS = [
 ('unknown','Función sin clasificar','Function not classified'),
 ('postdoc','Posdoctorado explícito','Explicit postdoctoral role'),
 ('faculty','Docencia universitaria','University teaching'),
 ('data','Datos y software','Data & software'),
 ('research','Investigación','Research'),
 ('engineering','Ingeniería y desarrollo','Engineering & development'),
 ('consulting','Consultoría y análisis','Consulting & analysis'),
 ('leadership','Dirección y gestión','Leadership & management'),
 ('health','Práctica clínica','Clinical practice'),
]
FUNCTION_RULES = [
 (1,r'\b(post[ -]?doc\w*|pos[ -]?doc\w*|postdoctoral|postdok\w*)\b'),
 (2,r'\b(professor\w*|profesor\w*|lecturer|catedrat\w*|dozent|docent|maitre de conferences|assistant teaching)\b'),
 (3,r'\b(data scien\w*|data analy\w*|software\w*|machine learning|data engineer\w*|programmer|bioinformatician)\b'),
 (4,r'\b(research\w*|investigador\w*|pesquisador\w*|chercheur\w*|scientist|wissenschaft\w*|ricercator\w*)\b'),
 (5,r'\b(engineer\w*|ingenier\w*|ingenieur\w*|engenheir\w*|developer|development)\b'),
 (6,r'\b(consult\w*|analyst|analista|economist|policy adviser)\b'),
 (7,r'\b(director|manager|ceo|cto|founder|president|head|gerente)\b'),
 (8,r'\b(physician|surgeon|clinician|nurse|medico|clinical psychologist)\b'),
]
PATTERNS=[re.compile(x[3]) for x in FIELDS]
FUNCTION_PATTERNS=[(i,re.compile(p)) for i,p in FUNCTION_RULES]

def norm(s):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFKD', s or '') if not unicodedata.combining(c)).lower().split())

def classify_field(doctorate):
    # The ubiquitous degree name must never classify every PhD as philosophy.
    text = norm(doctorate.get('department','') + ' ' + doctorate.get('role',''))
    text = re.sub(r'\b(doctor(?:ate)? (?:of|in) philosophy|philosophiae doctor|philosophy doctor|doktor der philosophie)\b', '', text)
    found=[i for i,p in enumerate(PATTERNS) if p.search(text)]
    return (found[0] if len(found)==1 else len(FIELDS)-1 if found else 0), found

def classify_function(role):
    text=norm(role)
    return next((i for i,p in FUNCTION_PATTERNS if p.search(text)),0)

class Organisations:
    def __init__(self):
        self.rows=json.loads((RAW/'ror/v2.12-2026-08-25-ror-data.json').read_text())
        self.by_id={}; self.by_grid={}; self.by_name=defaultdict(set)
        for n,r in enumerate(self.rows):
            self.by_id[r['id'].removeprefix('https://ror.org/')]=n
            for x in r['external_ids']:
                if x['type']=='grid':
                    for value in x['all']:self.by_grid[value]=n
            countries={loc['geonames_details']['country_code'] for loc in r['locations']}
            for name in r['names']:
                # Short acronyms collide and may not represent the named employer.
                if name['types']==['acronym']:continue
                key=norm(name['value'])
                if len(key)<5:continue
                for country in countries:self.by_name[(key,country)].add(n)

    @lru_cache(maxsize=400000)
    def resolve(self, identifier, kind, name, country):
        n=None; method='unmatched'
        if kind.upper()=='ROR':
            n=self.by_id.get(identifier.removeprefix('https://ror.org/').removeprefix('http://ror.org/'))
            if n is not None:method='ror-id'
        elif kind.upper()=='GRID':
            n=self.by_grid.get(identifier.removeprefix('https://www.grid.ac/institutes/'))
            if n is not None:method='grid-id'
        if n is None:
            candidates=self.by_name.get((norm(name),country),set())
            if len(candidates)==1:n=next(iter(candidates));method='exact-name-country'
        if n is None:return {'sector':0,'method':'unmatched','ror':''}
        r=self.rows[n]; types=r['types']; keys=[s[0] for s in SECTORS]
        sector=next((keys.index(k) for k in ['education','company','healthcare','government','nonprofit','facility','other'] if k in types),0)
        return {'sector':sector,'method':method,'ror':r['id'],'rorTypes':types}

    def enrich(self,a):
        return {**a, 'classification':self.resolve(a['organizationId'],a['organizationIdType'],a['organization'],a['country']), 'function':classify_function(a['role'])}

def json_bytes(obj):return json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()

def write_gzip(path,obj):
    blob=gzip.compress(json_bytes(obj),compresslevel=6,mtime=0)
    path.write_bytes(blob)
    return {'file':path.name,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest()}

def main():
    args=argparse.ArgumentParser();args.add_argument('--preview',action='store_true');args=args.parse_args()
    status=json.loads((RAW/'orcid-2025/parse-status.json').read_text())
    complete=status['status']=='complete' and status.get('md5')=='210edf71f4a2bb44dd33aaa3037b3f17'
    if not complete and not args.preview:raise SystemExit('The official archive is not complete and verified. Preview builds are not releasable.')
    OUT.mkdir(parents=True,exist_ok=True)
    # Only files owned by this builder; never remove research inputs.
    for p in OUT.glob('*.json.gz'):p.unlink()
    orgs=Organisations(); counts=Counter(); country_counts=Counter(); job_countries=Counter(); field_counts=Counter(); methods=Counter()
    groups={g:{'orgs':[],'roles':[],'rows':[]} for g in ['europe','us','other']}
    maps={g:({'':0},{'':0}) for g in groups}
    for g in groups:groups[g]['orgs'].append('');groups[g]['roles'].append('')
    indexes=[];details=[];detail_rows=[];index_nums=Counter(); seen=set()

    def index_value(g,kind,value):
        which=0 if kind=='orgs' else 1; mapping=maps[g][which]
        if value not in mapping:mapping[value]=len(groups[g][kind]);groups[g][kind].append(value)
        return mapping[value]

    def flush_index(g):
        chunk=groups[g]
        if not chunk['rows']:return
        name=f'index-{g}-{index_nums[g]:03d}.json.gz'
        indexes.append({**write_gzip(OUT/name,chunk),'group':g,'records':len(chunk['rows'])})
        index_nums[g]+=1;groups[g]={'orgs':[''],'roles':[''],'rows':[]};maps[g]=({'':0},{'':0})

    with (RAW/'orcid-doctoral-careers-2025.jsonl').open() as source:
        # A preview must use a fixed byte prefix even while the parser appends.
        limit=(RAW/'orcid-doctoral-careers-2025.jsonl').stat().st_size
        position=0
        for line in source:
            position+=len(line.encode())
            if position>limit:break
            if not line.endswith('\n'):break
            record=json.loads(line)
            if record['id'] in seen:counts['duplicateIds']+=1;continue
            seen.add(record['id'])
            # Revalidate at normalisation too: an ended doctoral exchange is not
            # proof of a degree from the host university. This also makes old raw
            # extracts safe when evidence rules are tightened after acquisition.
            original_degrees=record['doctorates']
            record['doctorates']=sorted([a for a in original_degrees if is_doctorate(a['role']) and completed_doctorate(a)],key=lambda a:a['end'])
            counts['excludedNonDegreeAffiliations']+=len(original_degrees)-len(record['doctorates'])
            if not record['doctorates']:
                counts['profilesWithoutQualifyingDegree']+=1
                continue
            phd=record['doctorates'][0]
            jobs=[orgs.enrich(a) for a in record['employments'] if later_job(a,phd)]
            # ORCID may contain duplicate affiliation assertions from integrations.
            distinct={json.dumps([a['organization'],a['country'],a['role'],a['start'],a['end']]):a for a in jobs}
            jobs=sorted(distinct.values(),key=lambda a:(a['start'],a['organization'],a['role']))
            if not jobs:counts['noEligibleJobs']+=1;continue
            first,last=jobs[0],jobs[-1]; field,matches=classify_field(phd)
            g='europe' if phd['country'] in EUROPE else 'us' if phd['country']=='US' else 'other'
            detail_num=len(details); detail_offset=len(detail_rows)
            record={**record,'doctorates':[orgs.enrich(a) for a in record['doctorates']],
                    'employments':jobs,'field':field,'fieldMatches':matches,
                    'employmentRule':'dated starts at or after doctorate; same-year order may be unknown'}
            detail_rows.append(record)
            def job_index(j):
                return [index_value(g,'orgs',j['organization']),j['country'],index_value(g,'roles',j['role']),j['start'][0],j['classification']['sector'],j['function']]
            a,b=phd['end'],first['start']
            ambiguous=int(a[0]==b[0] and (not a[1] or not b[1] or (a[1]==b[1] and (not a[2] or not b[2]))))
            row=[record['id'],record['name'],index_value(g,'orgs',phd['organization']),phd['country'],phd['end'][0],field,
                 *job_index(first),*job_index(last),detail_num,detail_offset,ambiguous,len(jobs)]
            groups[g]['rows'].append(row)
            counts['profiles']+=1;counts[g]+=1;counts['employmentRecords']+=len(jobs)
            counts['internationalLatest']+=int(bool(last['country']) and bool(phd['country']) and last['country']!=phd['country'])
            counts['ambiguousSameYearFirst']+=ambiguous
            country_counts[phd['country']]+=1;field_counts[field]+=1;methods[last['classification']['method']]+=1
            for job in jobs:job_countries[job['country']]+=1
            if len(detail_rows)==500:
                details.append({**write_gzip(OUT/f'detail-{detail_num:04d}.json.gz',detail_rows),'records':len(detail_rows)})
                detail_rows=[]
            if len(groups[g]['rows'])==20000:flush_index(g)
            if counts['profiles']%100000==0:print(json.dumps(dict(counts)),flush=True)
    if detail_rows:details.append({**write_gzip(OUT/f'detail-{len(details):04d}.json.gz',detail_rows),'records':len(detail_rows)})
    for g in groups:flush_index(g)
    labels=lambda rows:[{'id':a[0],'es':a[1],'en':a[2]} for a in rows]
    manifest={'version':1,'complete':complete,'snapshot':SNAPSHOT,'edition':'2026-09-19','counts':dict(counts),
              'fields':labels(FIELDS),'sectors':labels(SECTORS),'functions':labels(FUNCTIONS),'europe':sorted(EUROPE),
              'doctoralCountries':dict(country_counts.most_common()),'employmentCountries':dict(job_countries.most_common()),'fieldCounts':dict(field_counts),'organisationMatches':dict(methods),
              'indexes':indexes,'details':details,'archive':{k:status.get(k) for k in ['status','source','md5','sha256','counts','compressedBytesRead']},
              'sources':[
                 {'id':'orcid','title':'ORCID Public Data File 2025','url':'https://doi.org/10.23640/07243.30375589','license':'CC0 1.0','snapshot':SNAPSHOT},
                 {'id':'ror','title':'ROR v2.12 / schema 2.1','url':'https://zenodo.org/records/22099990','license':'CC0 1.0','snapshot':'2026-08-25',
                  'archiveBytes':36246232,'md5':'ce8807691455d4ada3216c31408e9e1a','sha256':hashlib.sha256((RAW/'v2.12-2026-08-25-ror-data.zip').read_bytes()).hexdigest()}],
              'rowSchema':['orcid','name','doctoralOrg','doctoralCountry','doctoralYear','field','firstOrg','firstCountry','firstRole','firstYear','firstSector','firstFunction','lastOrg','lastCountry','lastRole','lastYear','lastSector','lastFunction','detailShard','detailOffset','firstSameYearOrderUnknown','jobCount'],
              'limitations':['Public profiles are self-selected, incomplete and academically skewed. No population weights.',
                'Latest dated job start in the 2025-10-01 snapshot, not a verified current job. Concurrent roles remain in the detail.',
                'First observed job is not necessarily the first actual job. Chronology within the same period is uncertain when months or days are missing.',
                'Fields are rule-based from doctoral education text; unknown and multiple are retained. These are not official ISCED/FORD codes.',
                'Degree recognition uses explicit multilingual text markers; unrecognised labels are excluded. Visiting, exchange, sandwich and postdoctoral education entries are not treated as completed PhDs.',
                'Sector is an ROR organisation type using identifiers or a unique exact name plus reported country. Unmatched stays unknown.',
                'Country is the institution location, not nationality. The reported job country is never replaced by headquarters country.',
                'Europe convention includes all Russia, Turkey and Cyprus; it does not mean EU membership.']}
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'complete':complete,'counts':dict(counts),'indexMB':round(sum(i['bytes'] for i in indexes)/1e6,1),'detailMB':round(sum(i['bytes'] for i in details)/1e6,1),'organisationMatches':dict(methods)},ensure_ascii=False),flush=True)

if __name__=='__main__':main()
