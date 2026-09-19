import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const trajectories = JSON.parse(readFileSync('public/data/trajectories/manifest.json','utf8'));
if (!trajectories.complete || trajectories.archive.md5 !== '210edf71f4a2bb44dd33aaa3037b3f17') {
  throw new Error('Release blocked: the full ORCID archive must be extracted and checksum-verified.');
}
let revision = 'local';
try { revision = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim() } catch { /* initial checkout */ }
writeFileSync('public/release.json',JSON.stringify({revision,builtAt:new Date().toISOString(),dataEdition:'2026-09-19'})+'\n');
