import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve(process.env.EVIDENCE_DIR||'../evidencias/rendimiento');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:false,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173/?qa=1&diseno=original');await page.waitForFunction(()=>window.__bano?.snapshot().ready);
const results=[];
for(const design of ['original','nuevo']){
  await page.evaluate(async d=>{await window.__bano.chooseDesign(d);window.__bano.setQuality('equilibrado');},design);
  await page.evaluate(()=>window.__bano.startRoute());await page.waitForTimeout(10000);await page.evaluate(()=>window.__bano.clearFrames());
  const start=Date.now();await page.waitForTimeout(61000);
  const frames=await page.evaluate(()=>window.__bano.frameTimes());await page.evaluate(()=>window.__bano.stopRoute());
  const ordered=[...frames].sort((a,b)=>a-b),p=q=>ordered[Math.floor(q*(ordered.length-1))];
  const result={design,elapsedMs:Date.now()-start,warmupSeconds:10,frames:frames.length,frameTimeMs:{median:p(.5),p90:p(.9),p95:p(.95),p99:p(.99),max:ordered.at(-1)},meanFps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),snapshot:await page.evaluate(()=>window.__bano.snapshot()),browser:browser.version(),os:'macOS 26.6.2',hardware:'MacBook Air Mac14,2 — Apple M2, 8-core GPU, 16 GB unified memory'};
  results.push(result);console.log(JSON.stringify(result));await writeFile(path.join(out,`${design}-frames.json`),JSON.stringify(frames));
}
await writeFile(path.join(out,'benchmark.json'),JSON.stringify(results,null,2));await browser.close();
