"""Extract explicit, dated doctoral education and later employment from ORCID.

Read the official compressed archive without expanding its 864 GB XML payload.
Only professional education/employment fields are retained, never contact data.
The output is a research snapshot, not a census or verification of current jobs.
"""
from collections import Counter
from pathlib import Path
import hashlib
import io
import json
import os
import re
import tarfile
import time
import unicodedata
from lxml import etree
from fetch_orcid import RAW, SIZE, MD5, CHUNK, COUNT, URL

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = '2025-10-01'
OUTPUT = ROOT / 'data/raw/orcid-doctoral-careers-2025.jsonl'
PROGRESS = RAW / 'parse-status.json'
EDUCATIONS = re.compile(rb'<(?:[\w.-]+:)?education-summary\b[^>]*>.*?</(?:[\w.-]+:)?education-summary>', re.S)
DOCTORATE = re.compile(r'\b(?:ph\s*\.?\s*d\.?|d\.?\s*phil\.?|doctor of philosophy|philosophiae doctor|philosophy doctor|doctorat\w*|doctorad\w*|doctoraat|doctoral degree|doutorad\w*|doutoramento|doutor em|dottorat\w*|doktorat\w*|doktor der (?:naturwissenschaften|philosophie|ingenieurwissenschaften|wirtschaftswissenschaften|rechtswissenschaften)|doktorsexamen|doktorgrad|promotion|dr[. -]+(?:rer|ing|phil|sc)|doctor of science|doctor en|doctor in|doktor nauk)\b', re.I)
ONGOING = re.compile(r'\b(?:student|candidate|candidature|candidatura|doctorando|doctoranda|doutorando|doutoranda|ongoing|in progress|en curso|en andamento|honorary|honoris causa)\b', re.I)
NON_DEGREE = re.compile(r'\b(?:visiting|visitante|exchange|intercambio|sandwich|sanduiche|post[ -]?doc\w*|pos[ -]?doc\w*|research stay|research visit|internship|summer school)\b', re.I)
EUROPE = set('AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB VA'.split())


def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value or '') if not unicodedata.combining(c))


def is_doctorate(role):
    value = normalize(role)
    return bool(DOCTORATE.search(value)) and not bool(ONGOING.search(value)) and not bool(NON_DEGREE.search(value))


def before(a, b):
    """Compare only shared date precision; zero denotes missing, not January."""
    for first, second in zip(a, b):
        if not first or not second:
            return False
        if first != second:
            return first < second
    return False


def after_snapshot(d):
    return before([2025, 10, 1], d)


def completed_doctorate(d):
    return bool(d.get('end')) and not after_snapshot(d['end']) and (not d.get('start') or not before(d['end'], d['start']))


def value(node, path):
    found = node.find(path)
    return (found.text or '').strip() if found is not None else ''


def date(node, tag):
    found = node.find('{*}' + tag)
    if found is None:
        return None
    try:
        year = int(value(found, '{*}year'))
        if not 1900 <= year <= 2100:
            return None
        return [year, int(value(found, '{*}month') or 0), int(value(found, '{*}day') or 0)]
    except ValueError:
        return None


def affiliation(node):
    org = node.find('{*}organization')
    if org is None:
        return None
    source = node.find('{*}source')
    source_type = 'unknown'
    if source is not None:
        source_type = 'integration' if source.find('{*}source-client-id') is not None else 'self'
    return {
        'organization': value(org, '{*}name'),
        'country': value(org, '{*}address/{*}country'),
        'city': value(org, '{*}address/{*}city'),
        'organizationId': value(org, '{*}disambiguated-organization/{*}disambiguated-organization-identifier'),
        'organizationIdType': value(org, '{*}disambiguated-organization/{*}disambiguation-source'),
        'department': value(node, '{*}department-name'),
        'role': value(node, '{*}role-title'),
        'start': date(node, 'start-date'),
        'end': date(node, 'end-date'),
        'putCode': node.get('put-code'),
        'updated': value(node, '{*}last-modified-date'),
        'assertion': source_type,
        'sourceName': value(source, '{*}source-name') if source is not None else '',
    }


def later_job(job, doctorate):
    """Calendar-year relation; month/day precision is retained, not invented."""
    if not job.get('start') or not doctorate.get('end'):
        return False
    if not doctorate['end'][0] <= job['start'][0] or after_snapshot(job['start']):
        return False
    if before(job['start'], doctorate['end']):
        return False
    if job['end'] and before(job['end'], job['start']):
        return False
    if job['end'] and before(job['end'], doctorate['end']):
        return False
    return not ONGOING.search(normalize(job['role']))


class Chunks(io.RawIOBase):
    def __init__(self):
        self.index = 0
        self.file = None
        self.bytes = 0
        self.md5 = hashlib.md5()
        self.sha256 = hashlib.sha256()

    def readable(self):
        return True

    def read(self, size=-1):
        if self.index >= COUNT:
            return b''
        if self.file is None:
            path = RAW / f'chunk-{self.index:03d}.bin'
            while not path.exists():
                status_path = RAW / 'download-status.json'
                if status_path.exists():
                    status = json.loads(status_path.read_text())
                    if status['status'] == 'failed':
                        raise IOError('Download failed; rerun fetch_orcid.py to resume')
                    try:
                        os.kill(status['pid'], 0)
                    except ProcessLookupError:
                        raise IOError('Downloader stopped before this chunk was ready')
                time.sleep(1)
            self.file = path.open('rb')
        data = self.file.read(size)
        if not data:
            self.file.close()
            self.file = None
            self.index += 1
            return self.read(size)
        self.bytes += len(data)
        self.md5.update(data)
        self.sha256.update(data)
        return data


def main():
    started = time.time()
    counts = Counter()
    countries = Counter()
    examples = []
    stream = Chunks()
    status = 'running'
    def checkpoint():
        report = {'status': status, 'pid': os.getpid(), 'snapshot': SNAPSHOT,
                  'source': URL, 'elapsedSeconds': round(time.time() - started),
                  'compressedBytesRead': stream.bytes, 'counts': dict(counts),
                  'doctoralCountries': dict(countries.most_common()), 'examples': examples}
        if status == 'complete':
            report.update(md5=stream.md5.hexdigest(), sha256=stream.sha256.hexdigest())
        temp = PROGRESS.with_suffix('.tmp')
        temp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        temp.replace(PROGRESS)
    RAW.mkdir(parents=True, exist_ok=True)
    checkpoint()
    try:
        # Larger r|gz buffers cause repeated copies of expanded XML. The 10 KiB
        # default was ~9x faster than 1 MiB on the first 50,000 official records.
        with OUTPUT.open('w') as output, tarfile.open(fileobj=stream, mode='r|gz', bufsize=10240) as archive:
            for member in archive:
                # Streaming extractfile(member) needs no name lookup. tarfile's
                # otherwise retained TarInfo list grows to gigabytes on this dump.
                archive.members.clear()
                if not member.isfile() or not member.name.endswith('.xml'):
                    continue
                counts['profilesScanned'] += 1
                blob = archive.extractfile(member).read()
                if b'employment-summary' not in blob:
                    counts['noEmploymentSection'] += 1
                    continue
                education = b''.join(EDUCATIONS.findall(blob)).decode('utf-8', errors='replace')
                if not DOCTORATE.search(normalize(education)):
                    counts['noDoctoralMarker'] += 1
                    continue
                counts['doctoralMarkerCandidates'] += 1
                try:
                    root = etree.fromstring(blob)
                    educations = [affiliation(x) for x in root.iter('{http://www.orcid.org/ns/education}education-summary')]
                    doctorates = [e for e in educations if e and is_doctorate(e['role'])]
                    if not doctorates:
                        counts['noExplicitDoctoralDegree'] += 1
                        continue
                    counts['explicitDoctoralDegree'] += 1
                    completed = [e for e in doctorates if completed_doctorate(e)]
                    if not completed:
                        counts['noCompletedDoctoralDates'] += 1
                        continue
                    employments = [affiliation(x) for x in root.iter('{http://www.orcid.org/ns/employment}employment-summary')]
                    employments = [e for e in employments if e and e['organization']]
                    completed.sort(key=lambda x: x['end'])
                    qualifying = [e for e in employments if later_job(e, completed[0])]
                    if not qualifying:
                        counts['noDatedLaterEmployment'] += 1
                        continue
                    orcid = Path(member.name).stem
                    credit = value(root, './/{http://www.orcid.org/ns/personal-details}credit-name')
                    given = value(root, './/{http://www.orcid.org/ns/personal-details}given-names')
                    family = value(root, './/{http://www.orcid.org/ns/personal-details}family-name')
                    record = {'id': orcid, 'name': credit or ' '.join(x for x in [given, family] if x),
                              'doctorates': completed, 'employments': employments,
                              'snapshot': SNAPSHOT}
                    output.write(json.dumps(record, ensure_ascii=False, separators=(',', ':')) + '\n')
                    counts['qualifiedProfiles'] += 1
                    country = completed[0]['country'] or 'unknown'
                    countries[country] += 1
                    if country in EUROPE:
                        counts['europeDoctoralOrigin'] += 1
                    if country == 'US':
                        counts['usDoctoralOrigin'] += 1
                    if any(e['country'] and e['country'] != country for e in qualifying):
                        counts['internationalCareers'] += 1
                    if len(examples) < 8:
                        examples.append({'id': orcid, 'doctorateCountry': country,
                                         'department': completed[0]['department'],
                                         'employmentCountries': sorted({e['country'] for e in qualifying})})
                except (etree.XMLSyntaxError, ValueError) as error:
                    counts['parseErrors'] += 1
                    if counts['parseErrors'] <= 5:
                        print(json.dumps({'record': member.name, 'error': str(error)}), flush=True)
                if counts['profilesScanned'] % 10000 == 0 or counts['qualifiedProfiles'] % 1000 == 0:
                    output.flush()
                    checkpoint()
                    print(json.dumps({'profiles': counts['profilesScanned'], 'qualified': counts['qualifiedProfiles'],
                                      'europe': counts['europeDoctoralOrigin'], 'GB': round(stream.bytes / 1e9, 2)}), flush=True)
        # tar can stop at its end marker while compressed bytes remain buffered.
        while stream.read(1024 * 1024):
            pass
        if stream.bytes != SIZE or stream.md5.hexdigest() != MD5:
            raise ValueError('The complete official archive checksum does not match')
        status = 'complete'
        checkpoint()
    except BaseException:
        status = 'failed'
        checkpoint()
        raise


if __name__ == '__main__':
    main()
