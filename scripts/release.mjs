import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
let revision = 'local';
try { revision = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim() } catch { /* initial checkout */ }
writeFileSync('public/release.json',JSON.stringify({revision,builtAt:new Date().toISOString(),dataEdition:'2026-09-19'})+'\n');
