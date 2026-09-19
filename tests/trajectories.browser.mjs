import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL || 'http://127.0.0.1:5173/';
const out='.impeccable/review';
await fs.mkdir(out,{recursive:true});await fs.mkdir('test-results',{recursive:true});
const report={base,checks:[],errors:[],accessibility:[],geometry:[],timings:[]};
const browser=await chromium.launch({channel:process.env.CI?undefined:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();page.setDefaultTimeout(60000);
page.on('pageerror',e=>report.errors.push(e.message));
const pass=name=>{report.checks.push(name);console.log('PASS',name);};
const ready=async(p=page)=>{await p.locator('#career-results-title').waitFor();};
const go=async(query='')=>{const start=Date.now();await page.goto(base+query);await ready();report.timings.push({query,milliseconds:Date.now()-start});};
const geometry=async(label,p=page)=>{
 const value=await p.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth}));
 report.geometry.push({label,...value});assert.ok(value.body<=value.width+1,`${label} body overflow ${JSON.stringify(value)}`);
};
const axe=async(label,p=page)=>{const r=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.accessibility.push({label,violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});};
try {
 await go();
 assert.equal(await page.locator('.trajectory-record').count(),25);
 assert.equal(await page.getByRole('combobox',{name:'Fuente de datos',exact:true}).count(),0);
 assert.match(await page.locator('.trajectory-active-context').innerText(),/Europa.*Empleos/s);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/trajectories-desktop.png`,fullPage:false,animations:'disabled'});
 await page.screenshot({path:`${out}/trajectories-viewport.png`,animations:'disabled'});
 await geometry('default-desktop');await axe('default-desktop');pass('default is European doctorates with worldwide destinations');
 await page.locator('.trajectory-more-filters summary').click();
 await page.getByRole('combobox',{name:'Doctorado en',exact:true}).selectOption('GB');
 await page.getByRole('combobox',{name:'Empleo en',exact:true}).selectOption('US');await ready();
 assert.ok(await page.locator('.trajectory-record').count()>0);
 for(const r of await page.locator('.trajectory-origin > span').all())assert.match(await r.innerText(),/Reino Unido/);
 for(const r of await page.locator('.trajectory-destination > span').all())assert.match(await r.innerText(),/Estados Unidos/);
 assert.match(page.url(),/trOrigin=GB/);assert.match(page.url(),/trDestination=US/);
 await page.getByRole('combobox',{name:'Disciplina del doctorado',exact:true}).selectOption('4');await ready();
 for(const r of await page.locator('.trajectory-origin small').all())assert.match(await r.innerText(),/Física/);
 pass('doctoral country, employment country and discipline are independent filters');
 await page.getByRole('combobox',{name:'Puesto que se muestra',exact:true}).selectOption('first');await ready();
 await page.locator('.trajectory-detail-toggle').first().click();await page.locator('.career-timeline').first().waitFor();
 assert.ok(await page.locator('.career-evidence a[href^="https://orcid.org/"]').count());
 await page.screenshot({path:`${out}/trajectory-evidence-desktop.png`,fullPage:false,animations:'disabled'});
 await axe('evidence-desktop');pass('first observed job and source-linked dated career evidence');
 await go('?view=trajectories&trOrigin=all&trQ=Siemens');
 assert.ok(await page.locator('.trajectory-record').count()>0);
 await page.getByRole('button',{name:'Compartir filtros',exact:true}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),page.url());
 const downloading=page.waitForEvent('download');await page.locator('.trajectory-actions').getByRole('button',{name:'CSV',exact:true}).click();
 const download=await downloading;const path=await download.path();const csv=await fs.readFile(path,'utf8');assert.match(csv,/Siemens/i);assert.match(csv,/2025-10-01/);assert.match(csv,/doctoral_country/);pass('worldwide employer search, share link and filtered evidence CSV');
 await page.getByRole('button',{name:'Switch to English'}).click();await ready();assert.match(page.url(),/trQ=Siemens/);assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await page.getByRole('button',{name:'Cambiar a español'}).click();await ready();pass('language switch preserves trajectory filters');
 await page.getByRole('searchbox',{name:'Persona, universidad, empresa o puesto'}).fill('zzzz-nonexistent-career-412938');await ready();assert.equal(await page.locator('.trajectory-record').count(),0);assert.ok(await page.locator('.trajectory-empty').isVisible());pass('empty results state');
 await page.getByRole('searchbox',{name:'Buscar en listas universitarias'}).fill('Nexans');assert.equal(await page.locator('.university-list details').count(),1);await page.locator('.university-list summary').first().click();assert.match(await page.locator('.university-list ul').innerText(),/Nexans/);pass('independent university evidence search and disclosure');
 for(const width of [320,390,768]) {
  await page.setViewportSize({width,height:844});await go();await geometry(`mobile-${width}`);
  assert.equal(await page.locator('.trajectory-summary-inline details').getAttribute('open'),null);
  const nav=page.getByRole('navigation',{name:'Navegación móvil',exact:true});assert.ok(await nav.isVisible());
  for(const button of await nav.locator('a,button').all()){const box=await button.boundingBox();assert.ok(box.width>=44 && box.height>=44);}
  const jump=await page.locator('.trajectory-mobile-jump a').boundingBox();assert.ok(jump && jump.y+jump.height<770,`mobile ${width}: result jump outside viewport`);
  await page.screenshot({path:`${out}/trajectories-mobile-${width}.png`,fullPage:false,animations:'disabled'});
  if(width===390) {
   await axe('mobile-390');await nav.getByRole('button',{name:'Más secciones'}).click();
   const dialog=page.getByRole('dialog');assert.ok(await dialog.isVisible());assert.equal(await dialog.getByRole('link').count(),9);
   await page.screenshot({path:`${out}/navigation-mobile.png`,animations:'disabled'});await axe('mobile-menu');
   await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
   await nav.getByRole('button',{name:'Más secciones'}).click();await dialog.getByRole('link',{name:'Estudios',exact:true}).click();await page.locator('.studies-list').waitFor();
   await page.goBack();await ready();
   await nav.getByRole('link',{name:'Estadísticas',exact:true}).click();await page.getByRole('combobox',{name:'Fuente de datos',exact:true}).waitFor();
   await nav.getByRole('link',{name:'Trayectorias',exact:true}).click();await ready();
  }
 }
 pass('320–768px layouts, fixed touch navigation, all-section menu, Escape and browser history');
 const failing=await browser.newContext();const fp=await failing.newPage();fp.setDefaultTimeout(60000);
 await fp.route('**/data/trajectories/manifest.json',route=>route.abort());await fp.goto(base);await fp.getByRole('alert').waitFor();
 await fp.unroute('**/data/trajectories/manifest.json');await fp.getByRole('button',{name:'Volver a intentar',exact:true}).click();await ready(fp);await failing.close();pass('manifest failure and retry');
 const wk=await webkit.launch();const wc=await wk.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const wp=await wc.newPage();wp.setDefaultTimeout(60000);wp.on('pageerror',e=>report.errors.push('webkit '+e.message));
 await wp.goto(base+'?view=trajectories&trOrigin=US');await ready(wp);await geometry('webkit-us',wp);
 await wp.locator('.trajectory-detail-toggle').first().click();await wp.locator('.career-timeline').first().waitFor();
 await wp.screenshot({path:`${out}/trajectory-webkit-mobile.png`,fullPage:false,animations:'disabled'});await wk.close();pass('WebKit mobile: US origins, compressed shards, worker queries and evidence');
 report.passed=true;
} catch(error) {report.passed=false;report.failure=String(error);console.error(error);await page.screenshot({path:'test-results/trajectory-failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally {await browser.close();await fs.writeFile('test-results/trajectory-browser-report.json',JSON.stringify(report,null,2));}
if(report.errors.length || report.accessibility.some(a=>a.violations.length)){console.error(JSON.stringify({errors:report.errors,accessibility:report.accessibility.filter(a=>a.violations.length)},null,2));process.exitCode=1;}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,geometry:report.geometry,accessibility:report.accessibility.map(a=>({label:a.label,violations:a.violations.length})),timings:report.timings},null,2));
