import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root = new URL('../public/data/trajectories/',import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
const seen = new Set();
const counts = {europe:0,us:0,other:0};
test('every index row is unique, dated, grouped by doctoral origin and backed by an addressable detail',()=>{
  for (const file of manifest.indexes) {
    const bytes=fs.readFileSync(new URL(file.file,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    const part=JSON.parse(gunzipSync(bytes));assert.equal(part.rows.length,file.records);
    for (const r of part.rows) {
      assert.equal(r.length,22); assert.match(r[0],/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/);
      assert.ok(!seen.has(r[0]),`duplicate profile ${r[0]}`);seen.add(r[0]);
      assert.ok(r[4]>=1900 && r[4]<=2025);
      assert.ok(r[9]>=r[4] && r[15]>=r[9] && r[15]<=2025);
      assert.ok(manifest.fields[r[5]]);assert.ok(manifest.sectors[r[10]]);assert.ok(manifest.sectors[r[16]]);
      assert.equal(typeof part.orgs[r[2]],'string');assert.ok(part.orgs[r[6]]);assert.ok(part.orgs[r[12]]);
      assert.ok(manifest.details[r[18]]);assert.ok(r[19]<manifest.details[r[18]].records);
      const group=manifest.europe.includes(r[3])?'europe':r[3]==='US'?'us':'other';
      assert.equal(group,file.group);counts[group]++;
    }
  }
  assert.equal(seen.size,manifest.counts.profiles);
  for (const [group,count] of Object.entries(counts)) assert.equal(count,manifest.counts[group]);
  if(manifest.complete) {
    assert.equal(manifest.archive.md5,'210edf71f4a2bb44dd33aaa3037b3f17');
    assert.equal(manifest.archive.counts.qualifiedProfiles,manifest.counts.profiles+(manifest.counts.profilesWithoutQualifyingDegree||0)+(manifest.counts.noEligibleJobs||0)+(manifest.counts.duplicateIds||0));
  }
});
test('all career detail files match published hashes; sampled records preserve evidence without contact fields',()=>{
  let total=0;
  for(const [i,file] of manifest.details.entries()) {
    const bytes=fs.readFileSync(new URL(file.file,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);total+=file.records;
    if(i%50===0 || i===manifest.details.length-1) {
      const rows=JSON.parse(gunzipSync(bytes));assert.equal(rows.length,file.records);
      for(const row of rows) {
        assert.ok(row.doctorates.length && row.employments.length);assert.equal(row.snapshot,'2025-10-01');
        assert.ok(!/"(?:email|phone|birthdate|gender|address)"\s*:/.test(JSON.stringify(row)));
        for(const job of row.employments) {
          assert.ok(job.start && job.start[0]<=2025);assert.ok(job.country);
          assert.ok(['unmatched','ambiguous-name','ror-id','grid-id','exact-name-country','normalised-name-country','unique-acronym-country','university-unit','education-name','education-name-id-conflict','name-id-conflict'].includes(job.classification.method));
          if(['unmatched','ambiguous-name'].includes(job.classification.method)) assert.equal(job.classification.sector,0);
        }
      }
    }
  }
  assert.equal(total,manifest.counts.profiles);
});
test('university entries preserve separate denominators, source URLs and unknown current status',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../public/data/university-careers.json',import.meta.url)));
  assert.equal(data.combinedWithOrcid,false);
  assert.equal(data.records.length,295);
  assert.equal(data.sources.reduce((n,s)=>n+s.records,0),295);
  for(const row of data.records) { assert.ok(row.url.startsWith('https://'));assert.ok(row.name);assert.ok(row.appointments.length);assert.ok(!row.appointments.some(x=>/^TBC\.?$/.test(x))); }
});
