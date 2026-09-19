"""Build attributed, non-overlapping views from public statistical tables.

Counts are never added across sources or across aggregate/child discipline rows.
Suppression markers stay null and retain their original cell in the table archive.
"""
from pathlib import Path
import csv, json, re, unicodedata, warnings, shutil
import openpyxl
import pandas as pd

warnings.simplefilter('ignore', UserWarning)
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT/'data/raw'
OUT = ROOT/'public/data'
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'tables').mkdir(exist_ok=True)

def write(name,data):
 (OUT/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
def num(x):
 try: return float(x)
 except (ValueError,TypeError): return None
def slug(x):
 return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',str(x)).encode('ascii','ignore').decode().lower()).strip('-')
def table(name):
 return list(openpyxl.load_workbook(next(RAW.rglob(name)),read_only=True,data_only=True).active.values)
def bi(es,en): return {'es':es,'en':en}

translations={
 'All fields':'Todas las disciplinas','Science and engineering':'Ciencias e ingeniería','Non-science and engineering':'Otras grandes áreas',
 'Agricultural sciences and natural resources':'Agricultura y recursos naturales','Biological and biomedical sciences':'Biología y biomedicina',
 'Computer and information sciences':'Informática','Engineering':'Ingeniería','Geosciences, atmospheric, and ocean sciences':'Tierra, atmósfera y océanos',
 'Health sciences':'Ciencias de la salud','Mathematics and statistics':'Matemáticas y estadística',
 'Multidisciplinary/ interdisciplinary sciences':'Ciencias interdisciplinares','Physical sciences':'Ciencias físicas','Psychology':'Psicología',
 'Social sciences':'Ciencias sociales','Business':'Empresa','Education':'Educación','Humanities':'Humanidades',
 'Visual and performing arts':'Artes visuales y escénicas','Other non-science and engineering':'Comunicación y otras áreas',
 'Economics':'Economía','History':'Historia','Philosophy and religious studies':'Filosofía y estudios religiosos','Physics':'Física','Chemistry':'Química',
 'Applied mathematics':'Matemáticas aplicadas','Mathematics':'Matemáticas','Statistics':'Estadística','Computer science':'Ciencias de la computación',
 'Anthropology':'Antropología','Public policy analysis':'Políticas públicas','Political science and government':'Ciencia política',
 'Performing arts':'Artes escénicas','Visual arts, media studies, and design':'Artes visuales, medios y diseño',
 'English language and literature, letters':'Lengua y literatura inglesas','Foreign languages, literatures, and linguistics':'Lenguas, literaturas y lingüística',
 'Clinical psychology':'Psicología clínica','Public health':'Salud pública','Sociology, demography, and population studies':'Sociología y demografía',
 'Science':'Ciencias','Health':'Salud','Biological, agricultural, and environmental life sciences':'Biología, agricultura y medioambiente',
 'Physical sciences, geosciences, atmospheric sciences, and ocean sciences':'Ciencias físicas y de la Tierra',
 'Agricultural and food sciences':'Ciencias agrícolas y alimentarias','Total':'Todas las disciplinas','Ensemble':'Todas las disciplinas',
 'Biologie, médecine et santé':'Biología, medicina y salud','Chimie et sciences des matériaux':'Química y materiales',
 'Histoire, géographie':'Historia y geografía','Langues et littératures':'Lenguas y literaturas','Mathématiques et leurs interactions':'Matemáticas',
 'Philosophie et arts':'Filosofía y artes','Physique':'Física','Sciences agronomiques et écologiques':'Agronomía y ecología',
 'Sciences de la terre et de l’univers, espace':'Tierra, universo y espacio','Sciences et TIC':'Informática y TIC',
 'Sciences juridiques et politiques':'Derecho y ciencias políticas','Sciences pour l’ingénieur':'Ingeniería',
 'Sciences sociales, sociologie, démographie':'Ciencias sociales y demografía','Sciences économiques et de gestion':'Economía y gestión',
 'Sciences humaines':'Ciencias humanas','Sciences humaines et humanités':'Humanidades','Sciences du vivant':'Ciencias de la vida',
 'Sciences de la société':'Ciencias sociales','Sciences et leurs interactions':'Ciencias e ingeniería',
 'Computing':'Informática','Business and management':'Empresa y gestión','Historical, philosophical and religious studies':'Historia, filosofía y religión',
 'General and others in sciences':'Ciencias generales y otras','Creative arts and design':'Artes y diseño','Languages and area studies':'Lenguas y estudios regionales',
 'Law':'Derecho','Medicine and dentistry':'Medicina y odontología','Nursing and midwifery':'Enfermería','Architecture, building and planning':'Arquitectura y urbanismo',
 'Media, journalism and communications':'Medios y comunicación','Sociology, social policy and anthropology':'Sociología y antropología',
 'Politics':'Política','Pharmacology, toxicology and pharmacy':'Farmacia y toxicología','Biosciences':'Biociencias',
 'Agriculture, food and related studies':'Agricultura y alimentación','Allied health':'Otras ciencias de la salud','Veterinary sciences':'Veterinaria',
 'Sport and exercise sciences':'Ciencias del deporte','Materials and technology':'Materiales y tecnología',
 'Geography, earth and environmental studies':'Geografía, Tierra y medioambiente',
 'Physics and astronomy':'Física y astronomía','Mathematical sciences':'Ciencias matemáticas','Medical sciences':'Ciencias médicas',
 'Health and social care':'Salud y atención social','Combined and general studies':'Estudios combinados y generales',
 'History and archaeology':'Historia y arqueología','English studies':'Estudios ingleses','Education and teaching':'Educación y docencia',
 'General, applied and forensic sciences':'Ciencias generales, aplicadas y forenses','Celtic studies':'Estudios célticos',
 'Aerospace, aeronautical, astronautical, and space engineering':'Ingeniería aeroespacial, aeronáutica y astronáutica',
 'Agricultural, animal, plant, and veterinary sciences':'Ciencias agrícolas, animales, vegetales y veterinarias',
 'Area, ethnic, cultural, gender, and group studies':'Estudios regionales, étnicos, culturales, de género y de grupos',
 'Astronomy and astrophysics':'Astronomía y astrofísica','Biochemistry, biophysics, and molecular biology':'Bioquímica, biofísica y biología molecular',
 'Bioinformatics, biostatistics, and computational biology':'Bioinformática, bioestadística y biología computacional',
 'Biological and biomedical sciences, general':'Ciencias biológicas y biomédicas generales',
 'Biological and biomedical sciences, other':'Otras ciencias biológicas y biomédicas',
 'Biological, biomedical, and biosystems engineering':'Ingeniería biológica, biomédica y de biosistemas',
 'Business administration and management':'Administración y dirección de empresas','Business, other':'Otras áreas de empresa',
 'Cell/ cellular biology and anatomy':'Biología celular y anatomía','Chemical and petroleum engineering':'Ingeniería química y del petróleo',
 'Civil, environmental, and transportation engineering':'Ingeniería civil, ambiental y del transporte',
 'Communication and journalism':'Comunicación y periodismo','Computer and information sciences, other':'Otras ciencias informáticas y de la información',
 'Counseling and applied psychology':'Orientación y psicología aplicada','Ecology, evolutionary biology, and epidemiology':'Ecología, biología evolutiva y epidemiología',
 'Education leadership and administration':'Dirección y administración educativa','Education research':'Investigación educativa',
 'Education, other':'Otras áreas de educación','Electrical and computer engineering':'Ingeniería eléctrica e informática',
 'Engineering technologies':'Tecnologías de ingeniería','Engineering, other':'Otras ingenierías','Genetics and genomics':'Genética y genómica',
 'Geological and earth sciences':'Geología y ciencias de la Tierra','Health sciences, other':'Otras ciencias de la salud',
 'Humanities, other':'Otras humanidades','Industrial engineering and operations research':'Ingeniería industrial e investigación operativa',
 'Interdisciplinary computer sciences':'Informática interdisciplinar','Materials and mining engineering':'Ingeniería de materiales y minas',
 'Materials sciences':'Ciencia de materiales','Mechanical engineering':'Ingeniería mecánica','Microbiology and immunology':'Microbiología e inmunología',
 'Multidisciplinary/ interdisciplinary sciences, other':'Otras ciencias multidisciplinares e interdisciplinares',
 'Multidisciplinary/ interdisciplinary studies':'Estudios multidisciplinares e interdisciplinares',
 'Natural resources and conservation':'Recursos naturales y conservación','Neurobiology and neurosciences':'Neurobiología y neurociencias',
 'Non-science and engineering, other':'Otras áreas fuera de ciencias e ingeniería','Nursing and nursing science':'Enfermería y ciencias de la enfermería',
 'Ocean, marine, and atmospheric sciences':'Ciencias oceánicas, marinas y atmosféricas','Pharmacology and toxicology':'Farmacología y toxicología',
 'Pharmacy and pharmaceutical sciences':'Farmacia y ciencias farmacéuticas','Physiology, oncology, and cancer biology':'Fisiología, oncología y biología del cáncer',
 'Psychology, other':'Otras áreas de psicología','Public administration and social services':'Administración pública y servicios sociales',
 'Research and experimental psychology':'Psicología experimental y de investigación','Social sciences, other':'Otras ciencias sociales',
 'Teacher education and teaching fields':'Formación del profesorado y áreas de docencia',
 'Aerospace, aeronautical, and astronautical engineering':'Ingeniería aeroespacial, aeronáutica y astronáutica',
 'Agricultural engineering':'Ingeniería agrícola','Agricultural sciences':'Ciencias agrícolas','Animal sciences':'Ciencias animales',
 'Atmospheric sciences and meteorology':'Ciencias atmosféricas y meteorología','Biochemistry':'Bioquímica','Biochemistry and biophysics':'Bioquímica y biofísica',
 'Bioengineering and biomedical engineering':'Bioingeniería e ingeniería biomédica',
 'Biomathematics, bioinformatics, and computational biology':'Biomatemáticas, bioinformática y biología computacional',
 'Biophysics':'Biofísica','Botany and plant biology':'Botánica y biología vegetal','Cell, cellular biology, and molecular biology':'Biología celular y molecular',
 'Chemical engineering':'Ingeniería química','Chemistry, except biochemistry':'Química, excepto bioquímica',
 'Chemistry, other, except biochemistry':'Otras áreas de química, excepto bioquímica','Civil engineering':'Ingeniería civil',
 'Communication disorders sciences and services':'Ciencias y atención de los trastornos de la comunicación','Computer engineering':'Ingeniería informática',
 'Educational and school psychology':'Psicología educativa y escolar','Electrical, electronics, and communications engineering':'Ingeniería eléctrica, electrónica y de comunicaciones',
 'Engineering mechanics, physics, and science':'Mecánica, física y ciencias de la ingeniería',
 'Epidemiology, ecology, and population biology':'Epidemiología, ecología y biología de poblaciones',
 'Fish, fisheries, wildlife, and wildlands science and management':'Ciencia y gestión de pesca, fauna silvestre y espacios naturales',
 'Food sciences and technology':'Ciencia y tecnología de los alimentos','Forestry':'Ciencias forestales','Genetics':'Genética',
 'Geography and cartography':'Geografía y cartografía','Geological and earth sciences, geosciences':'Geología y ciencias de la Tierra',
 'Geosciences, atmospheric sciences, and ocean sciences':'Ciencias de la Tierra, la atmósfera y los océanos',
 'Hospital and medical administration services':'Administración hospitalaria y sanitaria','Immunology':'Inmunología',
 'Industrial and manufacturing engineering':'Ingeniería industrial y de fabricación','Industrial and organizational psychology':'Psicología industrial y de las organizaciones',
 'Information science, studies':'Ciencias y estudios de la información','Inorganic chemistry':'Química inorgánica',
 'International relations and national security studies':'Relaciones internacionales y estudios de seguridad nacional','Linguistics':'Lingüística',
 'Mathematics and statistics, other':'Otras áreas de matemáticas y estadística','Metallurgical and materials engineering':'Ingeniería metalúrgica y de materiales',
 'Microbiological sciences':'Ciencias microbiológicas','Microbiological sciences and immunology':'Ciencias microbiológicas e inmunología',
 'Natural resource conservation, research, management, and policy':'Conservación, investigación, gestión y políticas de recursos naturales',
 'Neurobiology and neuroscience':'Neurobiología y neurociencia','Nuclear engineering':'Ingeniería nuclear','Nutrition sciences':'Ciencias de la nutrición',
 'Ocean sciences and marine sciences':'Ciencias oceánicas y marinas','Oceanography, chemical and physical':'Oceanografía química y física',
 'Organic chemistry':'Química orgánica','Other biological sciences':'Otras ciencias biológicas','Other engineering':'Otras ingenierías',
 'Other social sciences':'Otras ciencias sociales','Pharmacy, pharmaceutical sciences, and administration':'Farmacia, ciencias farmacéuticas y administración farmacéutica',
 'Physiology, pathology, and related sciences':'Fisiología, patología y ciencias afines','Plant sciences':'Ciencias vegetales','Psychology, general':'Psicología general',
 'Registered nursing, nursing administration, nursing research':'Enfermería, administración e investigación en enfermería',
 'Soil sciences':'Ciencias del suelo','Urban studies, affairs':'Estudios y asuntos urbanos','Zoology':'Zoología',
}
def fieldlabel(s):return bi(translations.get(s,s),s)
broad = ['Agricultural sciences and natural resources','Biological and biomedical sciences','Computer and information sciences','Engineering','Geosciences, atmospheric, and ocean sciences','Health sciences','Mathematics and statistics','Multidisciplinary/ interdisciplinary sciences','Physical sciences','Psychology','Social sciences','Business','Education','Humanities','Visual and performing arts','Other non-science and engineering']

datasets=[]
sedrows=table('nsf25349-tab006-001.xlsx')[6:]
salaries={r[0]:r for r in table('nsf25349-tab006-007.xlsx')[4:]}
salaries['All fields']=salaries['Doctorate recipients reporting annual salary']
records=[]; family='All fields'
for i,r in enumerate(sedrows):
 if not isinstance(r[1],(int,float)):continue
 if r[0] in broad or r[0] in ['All fields','Science and engineering','Non-science and engineering']:family=r[0]
 salary=salaries.get(r[0])
 records.append(dict(id=f'sed-{i}',field=r[0],label=fieldlabel(r[0]),family=family,broad=r[0] in broad or r[0]=='All fields',year='2024',horizon='0',total=num(r[1]),committed=num(r[2]),denominator=num(r[3]),abroad=num(r[8]),unknownLocation=num(r[9]),values=[num(r[j]) for j in [4,5,6,7]],salary=num(salary[1]) if salary else None,salarySectors=[num(v) for v in salary[2:]] if salary else None))
datasets.append(dict(id='sed',name=bi('EE. UU. · al terminar','US · at graduation'),kind='plans',year='2024',country='US',unit='count',currency='USD',salaryPeriod='year',
 title=bi('Los primeros destinos','First destinations'),population=bi('Doctorados de investigación obtenidos en Estados Unidos en 2024, todas las disciplinas.','Research doctorates awarded in the United States in 2024, all disciplines.'),
 denominator=bi('Porcentajes entre quienes tienen un compromiso confirmado en EE. UU.','Percentages among graduates with a definite commitment within the US.'),
 note=bi('Son planes al terminar: pueden ser un puesto nuevo o el regreso a un empleo anterior. Industria incluye autoempleo. Otros reúne gobierno, ONG, escuelas y destinos desconocidos. Un postdoc es una etapa, no un sector.','Plans at graduation may be a new job or a return to a previous one. Industry includes self-employment. Other includes government, nonprofits, schools and unknown employment. A postdoc is a stage, not a sector.'),
 url='https://ncses.nsf.gov/pubs/nsf25349/data-tables',table='nsf25349-tab006-001',salaryTable='nsf25349-tab006-007',license='US government public statistics',
 categories=[bi('Postdoc','Postdoc'),bi('Empleo académico','Academic employment'),bi('Industria y empresa','Industry & business'),bi('Otros destinos','Other destinations')], records=records))

sal={r[0]:r for r in table('nsf25321-tab054.xlsx')[5:]}
unemp={}
for r in table('nsf25321-tab004-001.xlsx')[5:]:
 unemp.setdefault(r[0],[]).append(r)
sdrbroad=['Biological, agricultural, and environmental life sciences','Computer and information sciences','Mathematics and statistics','Physical sciences, geosciences, atmospheric sciences, and ocean sciences','Psychology','Social sciences','Engineering','Health']
records=[];family='All fields';seen=set()
for i,r in enumerate(table('nsf25321-tab012-003.xlsx')[5:]):
 if not isinstance(r[1],(int,float)):continue
 if r[0] in sdrbroad or r[0] in ['All fields','Science']:family=r[0]
 original=r[0]; label=fieldlabel(original)
 if original=='All fields':label=bi('Ciencias, ingeniería y salud','Science, engineering & health')
 if original in seen:label=bi(label['es']+' (subcampo)',label['en']+' (subfield)')
 field_id=original if original not in seen else original+' (subfield)'
 salary=sal.get(original) if original not in seen else None
 candidates=unemp.get(original,[]);u=candidates.pop(0) if candidates else None
 seen.add(original)
 records.append(dict(id=f'sdr-{i}',field=field_id,label=label,family=family,broad=original in sdrbroad or original=='All fields',year='2023',horizon='all',total=num(r[1]),denominator=num(r[1]),values=[num(r[j]) for j in [3,5,7]],se=[num(r[j]) for j in [4,6,8]],salary=num(salary[1]) if salary else None,unemployment=num(u[1]) if u else None))
datasets.append(dict(id='sdr',name=bi('EE. UU. · durante la carrera','US · across career stages'),kind='observed',year='2023',country='US',unit='count',currency='USD',salaryPeriod='year',
 title=bi('Dónde trabajan después','Where they work later'),population=bi('Personas ocupadas, menores de 76 años, residentes en EE. UU., con doctorado estadounidense en ciencias, ingeniería o salud. Todas las antigüedades.','Employed US residents under 76 with a US doctorate in science, engineering or health. All career stages.'),
 denominator=bi('Estimación ponderada de personas ocupadas. No es el tamaño de la muestra.','Weighted estimate of employed people, not the sample size.'),
 note=bi('Instituciones educativas incluye escuelas y hospitales universitarios. Empresa y otros incluye ONG, autoempleo y empleadores no clasificados. Recuentos redondeados a 50: las partes pueden no sumar el total. Los ingresos corresponden a empleo a tiempo completo.','Education includes schools and university hospitals. Business and other includes nonprofits, self-employment and unclassified employers. Counts are rounded to 50; parts may not sum to totals. Earnings cover full-time employment.'),
 url='https://ncses.nsf.gov/pubs/nsf25321/data-tables',table='nsf25321-tab012-003',salaryTable='nsf25321-tab054',license='US government public statistics',categories=[bi('Instituciones educativas','Educational institutions'),bi('Empresa y otros','Business & other'),bi('Gobierno','Government')],records=records))

fr=json.loads((RAW/'france-disciplines.json').read_text()); records=[]
for i,r in enumerate(fr):
 if r['genre']!='femmes et hommes':continue
 records.append(dict(id=f'fr-{i}',field=r['discipline_principale'],label=fieldlabel(r['discipline_principale']),family=r['disca'],broad=True,year=r['annee'],horizon='1' if r['situation'].startswith('12') else '3',total=num(r['nbre_de_repondants']),denominator=100,values=[num(r[k]) for k in ['part_secteur_academique','part_public_hors_secteur_academique','part_r_d_privee','part_prive_hors_secteur_academique_et_r_d']],salary=num(r['sal_net_med_mensuel']),employment=num(r['taux_insertion']),stable=num(r['part_stable']),abroad=num(r['part_en_emploi_a_l_etranger']),fulltime=num(r['part_temps_plein'])))
datasets.append(dict(id='france',name=bi('Francia · 1 y 3 años después','France · 1 & 3 years later'),kind='observed',year='2016',country='FR',unit='percent',currency='EUR',salaryPeriod='month-net',
 title=bi('La inserción, con perspectiva','Employment in perspective'),population=bi('Encuesta IP Doc a doctorados de las cohortes 2014 y 2016. Mujeres y hombres juntos.','IP Doc survey of the 2014 and 2016 doctoral cohorts. Women and men combined.'),
 denominator=bi('Distribución sectorial entre las personas ocupadas; n indica respuestas a la encuesta.','Sector shares among employed respondents; n denotes survey responses.'),
 note=bi('Datos históricos. El año del selector es la cohorte de graduación. Las proporciones están redondeadas. El salario es mediano, mensual y neto; no comparable directamente con salarios anuales brutos de otros países.','Historical data. The selected year is the graduation cohort. Shares are rounded. Salary is median monthly net income, not directly comparable with annual gross income elsewhere.'),
 url='https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-insertion-professionnelle-doctorat-par-discipline/',license='Etalab Licence Ouverte 2.0',categories=[bi('Sector académico','Academic sector'),bi('Sector público, fuera de academia','Public, outside academia'),bi('I+D privada','Private R&D'),bi('Privado, fuera de I+D','Private, outside R&D')],records=records))
write('france-institutions.json',json.loads((RAW/'france-institutions.json').read_text()))

# Restrict LEO to the UK-domiciled doctoral population, England providers, total
# demographics, geography and study mode. This avoids adding overlapping strata.
uk=[]
totals=['region_code_current','region_name_current','nation_of_domicile','sex','ethnicity_major','ethnicity_minor','inst_type','study_mode','age_band','POLAR4','prior_attainment','FSM','IDACI','region_name_origin','residence']
with (RAW/'leo-2023-24/data/underlying_data.csv').open(encoding='utf-8-sig') as f:
 for r in csv.DictReader(f):
  if r['qualification_level']!='Level 8' or r['country_of_domicile_grouped']!='UK' or r['provider_nation']!='England' or any(r[k]!='Total' for k in totals):continue
  if r['country_code']!='K02000001':continue
  only=num(r['sust_emp_only']);both=num(r['sust_emp_with_or_without_fs']);combined=num(r['sust_emp_fs_or_both'])
  values=[only,round(both-only,1) if both is not None and only is not None else None,round(combined-both,1) if combined is not None and both is not None else None,num(r['no_sust_dest']),num(r['activity_not_captured'])]
  uk.append(dict(id=f'uk-{len(uk)}',field=r['subject_name'],label=fieldlabel(r['subject_name']),family=r['subject_name'],broad=True,year=r['time_period'],cohort=r['academic_year'],horizon=r['YAG'].split()[0],total=num(r['matched']),denominator=100,values=values,salary=num(r['earnings_median']),salaryN=num(r['earnings_include']),salaryLow=num(r['earnings_LQ']),salaryHigh=num(r['earnings_UQ']),employment=both,unmatched=num(r['unmatched_percent']),overseas=num(r['overseas_percent'])))
datasets.append(dict(id='leo',name=bi('Inglaterra · hasta 10 años después','England · up to 10 years later'),kind='observed',year='202324',country='GB',unit='percent',currency='GBP',salaryPeriod='year',title=bi('El recorrido a largo plazo','The longer view'),
 population=bi('Doctorados (Level 8) de proveedores ingleses, con domicilio previo en Reino Unido. Registros LEO enlazados con datos fiscales.','Level 8 graduates from English providers, previously UK-domiciled. LEO linked education and tax records.'),
 denominator=bi('Porcentajes de titulados enlazados. Se excluye la emigración identificada.','Shares of matched graduates. Identified permanent emigrants are excluded.'),
 note=bi('Son estados laborales y de estudios, no sectores. «Sin destino sostenido» no equivale a desempleo. Las actividades no captadas son desconocidas. Cada horizonte corresponde a una cohorte distinta, no al seguimiento de una misma persona. Ingresos anuales nominales; no ajustados a jornada completa.','These are employment/study states, not sectors. No sustained destination is not unemployment. Uncaptured activity is unknown. Each horizon represents a different cohort, not the same individuals over time. Annual nominal earnings are not adjusted to full-time equivalents.'),
 url='https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24',license='Open Government Licence v3.0',categories=[bi('Solo empleo sostenido','Sustained employment only'),bi('Empleo y estudios','Employment & study'),bi('Solo estudios','Study only'),bi('Sin destino sostenido','No sustained destination'),bi('Actividad no captada','Activity not captured')],records=uk))

# Preserve official matrices, headings and suppression markers for inspection.
catalog=[]
for group,pub in [('sed-2024','nsf25349'),('sdr-2023','nsf25321')]:
 for p in sorted((RAW/group).rglob('*.xlsx')):
  rows=table(p.name); title=str(rows[1][0]); ident=p.stem
  write(f'tables/{ident}.json',{'rows':rows})
  catalog.append(dict(id=ident,title=title,source='SED 2024' if group.startswith('sed') else 'SDR 2023',rows=len(rows),columns=len(rows[0]),url=f'https://ncses.nsf.gov/pubs/{pub}/assets/data-tables/tables/{p.name}'))

# MIT-licensed historical placements; no inference that a university job is tenure track.
p=RAW/'econ-placements.dta'
econ=pd.read_stata(p).fillna('')
placements=[]
for i,r in econ.iterrows():
 placements.append(dict(id=f'econ-{i}',name=str(r['name']),year=int(r['year']) if num(r['year']) else None,employer=str(r['placement']),institution=str(r['inst']),field=str(r['primary_field']),type=str(r['type']),originalRegion=str(r['region'])))
by_id={r['id']:r for r in placements}
for correction in json.loads((ROOT/'data/placement-corrections.json').read_text()):
 row=by_id[correction['id']]
 assert row['employer']==correction['employer'], 'Review corrections when updating the source edition'
 row.update(reviewedType=correction['reviewedType'],classificationSource=correction['source'])
write('placements.json',placements)
sources=list(csv.DictReader((ROOT/'data/source-directory.csv').open()))
write('sources.json',sources)
write('datasets.json',datasets)
write('tables.json',catalog)
shutil.copyfile(RAW/'econ-license.txt',OUT/'econ-license.txt')
shutil.copyfile(ROOT/'data/manifest.json',OUT/'manifest.json')
with (OUT/'sources.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=sources[0].keys(),lineterminator='\n');w.writeheader();w.writerows(sources)
summary={'built':'2026-09-19','datasets':{d['id']:len(d['records']) for d in datasets},'placements':len(placements),'tables':len(catalog),'sourceDirectory':len(sources)}
write('summary.json',summary)
print(json.dumps(summary,indent=2))
