import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve(process.env.EVIDENCE_DIR||'../evidencias/borde-mueble/despues');await mkdir(out,{recursive:true});
const records=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:false,...(name==='chromium'?{channel:'chromium',args:['--use-angle=metal']}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/?qa=1&diseno=original');await page.waitForFunction(()=>window.__bano?.snapshot().ready,undefined,{timeout:120000});
 await page.evaluate(()=>window.__bano.setQuality('alto'));
 for(const design of ['original','nuevo']){
  await page.evaluate(d=>window.__bano.chooseDesign(d),design);
  for(const [view,pose] of Object.entries({borde:[[-.30,1.62,-2.08],[-1.10,1.55,-2.58],71],cerca:[[-.45,1.70,-2.27],[-1.19,1.50,-2.56],50],oblicuo:[[-.10,1.62,-1.84],[-1.10,1.45,-2.58],71]})){
   await page.evaluate(a=>window.__bano.pose(...a),pose);await page.waitForTimeout(350);
   await page.screenshot({path:path.join(out,`${name}-${design}-${view}.png`)});
   records.push({browser:name,version:browser.version(),design,view,state:await page.evaluate(()=>window.__bano.snapshot())});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{window.__bano.setQuality('ligero');window.__bano.setView('diagonal');});
 await page.getByRole('button',{name:'Abrir ventana',exact:true}).click();await page.waitForFunction(()=>window.__bano.snapshot().windowOpen===1);
 await page.screenshot({path:path.join(out,`${name}-movil.png`)});
 records.push({browser:name,version:browser.version(),view:'movil',errors,state:await page.evaluate(()=>window.__bano.snapshot())});
 await browser.close();if(errors.length)throw new Error(JSON.stringify(errors));
}
await writeFile(path.join(out,'capture-log.json'),JSON.stringify({records},null,2));console.log(`PASS: ${records.length} captures, no console errors or shader warnings.`);
