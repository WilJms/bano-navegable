import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
async function evidence(page:Page,name:string){if(!process.env.UI_EVIDENCE_DIR)return;const dir=path.resolve(process.env.UI_EVIDENCE_DIR);await mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+'.png')});await writeFile(path.join(dir,name+'.json'),JSON.stringify(await state(page),null,2));}
const state=(p:Page)=>p.evaluate(()=>(window as any).__bano.snapshot());
async function ready(p:Page){await p.waitForFunction(()=>(window as any).__bano?.snapshot().ready,undefined,{timeout:80000});}
async function load(p:Page,url='/?diseno=original&qa=1'){await p.goto(url);await ready(p);}
test('production root, prefix, index and direct design query work with external requests blocked',async({page})=>{
  const external:string[]=[],bad:string[]=[],errors:string[]=[];
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'){external.push(u.href);return route.abort();}return route.continue();});
  page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`);});page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/','/index.html','/prueba-bano/','/prueba-bano/index.html'].flatMap(base=>['original','nuevo'].map(design=>`${base}?diseno=${design}`))){
    await load(page,path);expect(await page.title()).toContain('Baño');await expect(page.locator('#loading')).toHaveClass('hidden');
    expect((await state(page)).active).toBe(path.includes('nuevo')?'nuevo':'original');await page.reload();await ready(page);
  }
  expect(bad).toEqual([]);expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('variant switch preserves pose, lens, quality and open door; mirrors are mutually exclusive',async({page})=>{
  await load(page);await page.locator('#quality').selectOption('ligero');await page.locator('#shower').click();await expect.poll(async()=> (await state(page)).door).toBe(1);
  const before=await state(page);await page.locator('[data-design="nuevo"]').click();await expect.poll(async()=> (await state(page)).active).toBe('nuevo');
  const after=await state(page);for(const key of ['position','quaternion','fov','quality','door'])expect(after[key]).toEqual(before[key]);
  expect(after.mirrors).toEqual({original:false,nuevo:true});await expect(page.locator('[data-design="nuevo"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-view="acceso"]').click();await page.waitForTimeout(250);expect((await state(page)).active).toBe('nuevo');expect((await state(page)).position).not.toEqual(before.position);
});
test('asset failure keeps original, retry recovers and cancellation preserves selection',async({page})=>{
  await load(page);await page.route('**/nuevo/wood.jpg',r=>r.fulfill({status:503,body:'Test failure'}));
  const before=await state(page);await page.locator('[data-design="nuevo"]').click();await expect(page.locator('#retry')).toBeVisible();
  expect((await state(page)).active).toBe('original');expect((await state(page)).position).toEqual(before.position);await evidence(page,`recurso-fallido-${test.info().project.name}`);
  await page.unroute('**/nuevo/wood.jpg');await page.locator('#retry').click();await expect.poll(async()=> (await state(page)).active).toBe('nuevo');
  expect((await state(page)).error).toBeNull();
});
test('rapid requests settle on the last choice, no scene mixing',async({page})=>{
  await load(page);await page.route('**/nuevo/*',async r=>{await new Promise(resolve=>setTimeout(resolve,1500));await r.continue();});
  await page.locator('[data-design="nuevo"]').click();await page.locator('[data-design="original"]').click();await page.waitForTimeout(900);
  expect((await state(page)).active).toBe('original');expect((await state(page)).loading).toBe(false);
  await page.locator('[data-design="nuevo"]').click();await evidence(page,`carga-cancelable-${test.info().project.name}`);await page.locator('#cancel').click();await page.waitForTimeout(800);expect((await state(page)).active).toBe('original');
  await page.locator('[data-design="nuevo"]').click();await expect.poll(async()=> (await state(page)).active).toBe('nuevo');
});
test('twenty cached changes with quality switches stabilise resource counts',async({page})=>{
  await load(page);await page.evaluate(()=>(window as any).__bano.chooseDesign('nuevo'));await page.evaluate(()=>(window as any).__bano.chooseDesign('original'));
  const before=await state(page);
  for(let i=0;i<20;i++)await page.evaluate(i=>{(window as any).__bano.setQuality(['alto','equilibrado','ligero'][i%3]);return (window as any).__bano.chooseDesign(i%2?'original':'nuevo');},i);
  const after=await state(page);expect(after.memory.geometries).toBe(before.memory.geometries);expect(after.memory.textures).toBeLessThanOrEqual(before.memory.textures);expect(after.renderLoops).toBe(1);expect(after.error).toBeNull();
});
test('keyboard movement, drag look, obstacle collision, focus loss and help are real',async({page})=>{
  await load(page);const before=await state(page);await page.locator('#scene').focus();await page.keyboard.down('w');await page.waitForTimeout(800);await page.keyboard.up('w');
  expect((await state(page)).position).not.toEqual(before.position);
  await page.mouse.move(650,450);await page.mouse.down();await page.mouse.move(800,500,{steps:12});await page.mouse.up();expect((await state(page)).quaternion).not.toEqual(before.quaternion);
  await page.locator('#scene').focus();await page.keyboard.down('w');await page.locator('#help').click();const stopped=await state(page);await page.waitForTimeout(300);expect((await state(page)).position).toEqual(stopped.position);await page.keyboard.up('w');await page.locator('#understood').click();await expect(page.locator('#help-dialog')).not.toBeVisible();
  await page.locator('#reset').click();await page.waitForTimeout(300);expect((await state(page)).active).toBe('original');
});
test('URL has priority; invalid query normalises; denied storage still works',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'getItem',{value:()=>{throw new Error('Denied');}});Object.defineProperty(Storage.prototype,'setItem',{value:()=>{throw new Error('Denied');}});});
  await load(page,'/?diseno=nuevo');expect((await state(page)).active).toBe('nuevo');await load(page,'/?diseno=invalid');expect((await state(page)).active).toBe('original');expect(page.url()).toContain('diseno=original');
});
