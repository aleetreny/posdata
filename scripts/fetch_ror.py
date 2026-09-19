"""Fetch the pinned, public CC0 ROR edition used by this trajectory release."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import shutil
import zipfile

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data/raw'
NAME='v2.12-2026-08-25-ror-data.zip'
URL='https://zenodo.org/api/records/22099990/files/'+NAME+'/content'
MD5='ce8807691455d4ada3216c31408e9e1a'
SIZE=36246232

def main():
    RAW.mkdir(exist_ok=True,parents=True)
    path=RAW/NAME
    if not path.exists():
        temp=path.with_suffix('.zip.part')
        with urlopen(Request(URL,headers={'User-Agent':'Posdata public research data'}),timeout=120) as r,temp.open('wb') as f:shutil.copyfileobj(r,f)
        if temp.stat().st_size!=SIZE or hashlib.md5(temp.read_bytes()).hexdigest()!=MD5:raise ValueError('ROR checksum mismatch; partial file preserved for inspection')
        temp.replace(path)
    blob=path.read_bytes()
    if len(blob)!=SIZE or hashlib.md5(blob).hexdigest()!=MD5:raise ValueError('Existing ROR file failed verification')
    destination=RAW/'ror';destination.mkdir(exist_ok=True)
    # Select a single known filename, never extract arbitrary archive paths.
    filename='v2.12-2026-08-25-ror-data.json'
    with zipfile.ZipFile(path) as archive:(destination/filename).write_bytes(archive.read(filename))
    print(json.dumps({'source':URL,'md5':MD5,'sha256':hashlib.sha256(blob).hexdigest(),'bytes':len(blob),'organizations':len(json.loads((destination/filename).read_text()))}))

if __name__=='__main__':main()
