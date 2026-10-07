import { chromium } from '@playwright/test';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve(process.env.EVIDENCE_DIR||'../evidencias/capturas');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:process.env.CI==='true',args:process.env.CI?[]:['--use-angle=metal']});const page=await browser.newPage({viewport:{width:1360,height:1156},deviceScaleFactor:1});
const errors=[],records=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
await page.goto('http://127.0.0.1:4173/?qa=1&diseno=original');
await page.waitForFunction(()=>window.__bano?.snapshot().ready,undefined,{timeout:120000});
await page.evaluate(()=>window.__bano.setQuality('alto'));
async function shot(name,clean=true){await page.waitForTimeout(400);if(clean)await page.evaluate(()=>document.body.classList.add('clean'));await page.screenshot({path:path.join(out,name+'.png')});records.push({image:name+'.png',state:await page.evaluate(()=>window.__bano.snapshot())});await page.evaluate(()=>document.body.classList.remove('clean'));}
for(const design of ['original','nuevo']){
 await page.evaluate(d=>window.__bano.chooseDesign(d),design);
 for(const view of ['diagonal','acceso','frontal_vanitorio']){
  await page.setViewportSize(view==='acceso'?{width:1036,height:870}:view==='diagonal'&&design==='nuevo'?{width:1024,height:870}:{width:1360,height:1156});
  await page.evaluate(v=>window.__bano.setView(v),view);await shot(`${design}-${view}`);
 }
 await page.setViewportSize({width:1440,height:960});
 for(const [name,position,target,fov] of [
  ['lavabo-detalle',[-.25,1.62,-1.65],[-.91,.73,-1.65],59],
  ['separacion-izquierda',[0,1.62,-.70],[-.94,.78,-.772],56],
  ['separaciones-arriba',[.20,1.62,-1.65],[-1.04,.67,-1.65],86],
  ['ventana-izquierda',[-.43,1.62,-2.60],[-.35,1.64,-3.33],76],
  ['ventana-derecha',[.10,1.62,-2.60],[-.35,1.64,-3.33],76],
  ['ventana-hueco',[.14,1.62,-2.37],[-.35,1.56,-3.45],65],
  ['espejo-oblicuo',[.12,1.62,-2.92],[-1.17,1.50,-1.65],76],
  ['vidrio-desde-ducha',[.95,1.682,-.77],[-.98,1.32,-1.65],78],
  ['ducha-extremo-acceso',[-.16,1.62,-1.25],[.86,1.23,-.35],80],
  ['ducha-esquina-superior',[-.15,1.62,-1.1],[.90,2.13,-.35],70],
  ['sanitario',[.01,1.62,-2.42],[1.08,.62,-2.72],67]
 ]){await page.evaluate(([p,t,f])=>window.__bano.pose(p,t,f),[position,target,fov]);await shot(`${design}-${name}`);}
 await page.evaluate(()=>window.__bano.pose([.14,1.62,-2.37],[-.35,1.56,-3.45],65));
 await page.locator('#window').click();await page.waitForFunction(()=>window.__bano.snapshot().windowOpen===1);
 await shot(`${design}-ventana-abierta`);if(design==='nuevo')await shot('ventana-abierta-interfaz',false);
 await page.locator('#window').click();await page.waitForFunction(()=>window.__bano.snapshot().windowOpen===0);
}
await page.evaluate(()=>window.__bano.setView('diagonal'));await shot('interfaz-escritorio',false);
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__bano.setQuality('ligero'));await shot('interfaz-movil-vertical',false);
await page.setViewportSize({width:844,height:390});await shot('interfaz-movil-horizontal',false);
await writeFile(path.join(out,'capture-log.json'),JSON.stringify({errors,browser:browser.version(),assetManifest:JSON.parse(await readFile('public/assets/manifest.json','utf8')),records},null,2));await writeFile(path.join(out,'separaciones-log.json'),JSON.stringify({errors,browser:browser.version(),records:records.filter(r=>r.image.includes('separaci'))},null,2));console.log(JSON.stringify({errors,images:records.length},null,2));await browser.close();
