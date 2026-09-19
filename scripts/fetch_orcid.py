"""Download the official ORCID 2025 summary archive in resumable byte ranges.

The 46 GB archive expands to about 864 GB. Keep it compressed; parse_orcid.py
reads these chunks as one stream, including while the download is running.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import json
import os
import threading
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/orcid-2025'
URL = 'https://ndownloader.figshare.com/files/58834837'
SIZE = 46328319190
MD5 = '210edf71f4a2bb44dd33aaa3037b3f17'
CHUNK = 512 * 1024 * 1024
COUNT = (SIZE + CHUNK - 1) // CHUNK
LOCK = threading.Lock()
STATE = {'status': 'running', 'source': URL, 'snapshot': '2025-10-01',
         'totalBytes': SIZE, 'expectedMd5': MD5, 'chunkBytes': CHUNK,
         'chunks': COUNT, 'completedChunks': 0, 'downloadedBytes': 0,
         'started': time.time(), 'pid': os.getpid(), 'errors': []}


def checkpoint():
    with LOCK:
        sizes = []
        for path in RAW.glob('chunk-*'):
            try:
                sizes.append(path.stat().st_size)
            except FileNotFoundError:
                pass  # Another worker atomically completed this chunk.
        STATE['downloadedBytes'] = sum(sizes)
        STATE['completedChunks'] = len(list(RAW.glob('chunk-*.bin')))
        STATE['updated'] = time.time()
        temp = RAW / 'download-status.tmp'
        temp.write_text(json.dumps(STATE, indent=2) + '\n')
        temp.replace(RAW / 'download-status.json')


def fetch(index):
    start = index * CHUNK
    end = min(SIZE, start + CHUNK) - 1
    size = end - start + 1
    final = RAW / f'chunk-{index:03d}.bin'
    part = RAW / f'chunk-{index:03d}.part'
    if final.exists() and final.stat().st_size == size:
        return index
    for attempt in range(5):
        offset = part.stat().st_size if part.exists() else 0
        if offset == size:
            part.replace(final)
            checkpoint()
            return index
        if offset > size:
            raise ValueError(f'Oversized chunk {index}; preserve and inspect it')
        try:
            req = urllib.request.Request(URL, headers={
                'Range': f'bytes={start + offset}-{end}',
                'User-Agent': 'Posdata doctoral career atlas; public CC0 research data',
            })
            with urllib.request.urlopen(req, timeout=90) as response:
                expected = f'bytes {start + offset}-{end}/{SIZE}'
                if response.status != 206 or response.headers.get('Content-Range') != expected:
                    raise ValueError(f'Unexpected byte range for chunk {index}')
                with part.open('ab') as output:
                    last = time.monotonic()
                    while data := response.read(1024 * 1024):
                        output.write(data)
                        if time.monotonic() - last > 10:
                            output.flush()
                            checkpoint()
                            last = time.monotonic()
            if part.stat().st_size != size:
                raise IOError(f'Incomplete chunk {index}')
            part.replace(final)
            checkpoint()
            print(json.dumps({'chunk': index, 'complete': STATE['completedChunks'],
                              'total': COUNT, 'GB': round(STATE['downloadedBytes'] / 1e9, 2)}), flush=True)
            return index
        except Exception as error:
            if attempt == 4:
                raise
            print(json.dumps({'retry': index, 'attempt': attempt + 1, 'error': str(error)}), flush=True)
            time.sleep(min(60, 5 * 2 ** attempt))
    raise RuntimeError(f'Failed chunk {index}')


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    # Preserve and reuse the initial sequential download; no duplicate bytes.
    legacy = ROOT / 'data/raw/orcid-2025-summaries.tar.gz.part'
    if legacy.exists() and not list(RAW.glob('chunk-*')):
        with legacy.open('rb') as source:
            index = 0
            while data := source.read(CHUNK):
                complete = len(data) == min(CHUNK, SIZE - index * CHUNK)
                (RAW / f'chunk-{index:03d}.{"bin" if complete else "part"}').write_bytes(data)
                index += 1
        legacy.unlink()
    checkpoint()
    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            for future in as_completed([executor.submit(fetch, i) for i in range(COUNT)]):
                future.result()
        STATE['status'] = 'complete'
    except BaseException as error:
        STATE['status'] = 'failed'
        STATE['errors'].append(str(error))
        raise
    finally:
        checkpoint()


if __name__ == '__main__':
    main()
