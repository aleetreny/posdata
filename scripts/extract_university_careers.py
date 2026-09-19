"""Extract factual public placement entries without inventing dates or countries.

These lists are searchable supporting evidence, never added to the ORCID counts:
names alone cannot reliably deduplicate the two populations.
"""
from collections import defaultdict
from pathlib import Path
from urllib.request import Request, urlopen
from lxml import html
import csv
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data/raw/university'
OUT=ROOT/'public/data'
SOURCES=[
 {'id':'oxford','institution':'University of Oxford','country':'GB','field':'philosophy',
  'url':'https://philosophy.web.ox.ac.uk/dphil-placement-record',
  'note':'Published appointments, with consent. Announcement year is not job start year; future appointments may be included.'},
 {'id':'glasgow','institution':'University of Glasgow','country':'GB','field':'physics',
  'url':'https://www.gla.ac.uk/schools/physics/research/groups/mcmp/phdstudy/destinationsofstudents/',
  'note':'Selected workplaces of Materials and Condensed Matter Physics alumni since 1995. Individual dates are not supplied.'},
 {'id':'cattolica','institution':'Università Cattolica del Sacro Cuore','country':'IT','field':'multiple',
  'url':'https://dottorati.unicatt.it/corsi/science/alumni-and-students.html',
  'note':'Science programme alumni. Graduation dates are supplied; the observation date of each current-position statement is not.'},
]
def text(node):return ' '.join(node.text_content().split())

def main():
 RAW.mkdir(parents=True,exist_ok=True)
 records=[]; audit=[]
 for s in SOURCES:
  path=RAW/(s['id']+'.html')
  if not path.exists():path.write_bytes(urlopen(Request(s['url'],headers={'User-Agent':'Posdata public academic careers research'}),timeout=60).read())
  blob=path.read_bytes();tree=html.fromstring(blob);rows=[]
  if s['id']=='oxford':
   people=defaultdict(list)
   for p in tree.xpath('//p'):
    value=text(p)
    match=re.match(r'^(.+?)\s*\(([^()]*?\b(?:19|20)\d{2}[^()]*?)\)\s*:\s*(.+)$',value)
    if not match:continue
    name,education,appointment=match.groups()
    # Only a dated doctorate explicitly in the name's brackets; keep raw AOS.
    years=re.findall(r'\b(?:19|20)\d{2}\b',education.split(';')[0])
    if not years or int(years[0])>2026 or len(name)>90:continue
    people[(name.strip(),education.strip())].append(appointment.strip())
   # The same alumnus can have multiple appearances with different AOS wording.
   by_name={}
   for (name,education),appointments in people.items():
    key=name.casefold()
    if key not in by_name:by_name[key]={'name':name,'doctoralDetail':education,'appointments':[]}
    by_name[key]['appointments'].extend(appointments)
   rows=list(by_name.values())
  elif s['id']=='glasgow':
   by_name={}
   for tr in tree.xpath('//table//tr'):
    cells=[text(x) for x in tr.xpath('./td')]
    for i in range(0,len(cells)-1,2):
     name,employer=cells[i:i+2]
     if not name or not employer or 'studentship' in employer.lower():continue
     if name not in by_name:by_name[name]={'name':name,'doctoralDetail':'Materials and Condensed Matter Physics; year not supplied','appointments':[]}
     by_name[name]['appointments'].append(employer)
   rows=list(by_name.values())
  else:
   for card in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," details-wrapper ")]'):
    headings=card.xpath('.//h2'); value=text(card)
    if not headings or 'Graduated in ' not in value:continue
    match=re.search(r'Graduated in (.+?)\.\s*Current position:\s*(.+)',value)
    if not match:continue
    graduation,position=match.groups()
    if position.strip('. ').upper()=='TBC':continue
    rows.append({'name':text(headings[0]),'doctoralDetail':'Science; '+graduation,'appointments':[position.strip()]})
  for row in rows:
   row.update(source=s['id'],institution=s['institution'],country=s['country'],field=s['field'],url=s['url'],retrieved='2026-09-19')
   row['appointments']=list(dict.fromkeys(row['appointments']))
   records.append(row)
  audit.append({**s,'records':len(rows),'retrieved':'2026-09-19','sha256':hashlib.sha256(blob).hexdigest(),'license':'No open licence established; factual entries with attribution, source prose and images not republished.'})
 output={'version':1,'sources':audit,'records':records,'countUnit':'source-specific alumni entries, not globally unique people','combinedWithOrcid':False}
 (OUT/'university-careers.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
 with (OUT/'university-careers.csv').open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=['name','institution','country','field','doctoralDetail','appointments','source','url','retrieved'],lineterminator='\n');writer.writeheader()
  for row in records:writer.writerow({**row,'appointments':' | '.join(row['appointments'])})
 print(json.dumps({'records':len(records),'sources':[(s['id'],s['records']) for s in audit]},ensure_ascii=False))

if __name__=='__main__':main()
