import {test,expect} from '@playwright/test';
test('touch movement plus look, cancellation, and orientation change',async({page,browserName})=>{
  test.skip(browserName!=='chromium','Multi-contact test uses Chromium input emulation; physical touch remains untested.');
  await page.setViewportSize({width:390,height:844});await page.goto('/?diseno=nuevo&qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await expect(page.locator('#joystick')).toBeVisible();
  const session=await page.context().newCDPSession(page);await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  const before=await page.evaluate(()=>(window as any).__bano.snapshot());
  const bounds=await page.locator('#joystick').boundingBox();const x=bounds!.x+bounds!.width/2,y=bounds!.y+bounds!.height/2;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y},{id:2,x:270,y:360}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x,y:y-31},{id:2,x:304,y:335}]});await page.waitForTimeout(600);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await page.evaluate(()=>(window as any).__bano.snapshot());expect(after.position).not.toEqual(before.position);expect(after.quaternion).not.toEqual(before.quaternion);
  await page.waitForTimeout(200);expect((await page.evaluate(()=>(window as any).__bano.snapshot())).position).toEqual(after.position);
  await page.setViewportSize({width:844,height:390});await expect(page.locator('#shower')).toBeVisible();await expect(page.locator('#window')).toBeVisible();await expect(page.locator('#joystick')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('graphics context is restored with fresh interior reflection',async({page,browserName})=>{
  await page.goto('/?diseno=original&qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await page.locator('#window').click();await expect.poll(()=>page.evaluate(()=>(window as any).__bano.snapshot().windowOpen)).toBe(1);
  const available=await page.evaluate(()=>!!(document.querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context')));
  test.skip(!available,'Context-loss extension not available in this environment.');
  await page.evaluate(()=>{const ext=document.querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;ext.loseContext();setTimeout(()=>ext.restoreContext(),700);});
  await expect(page.locator('#notice-text')).toContainText('contexto');await page.waitForFunction(()=>(window as any).__bano.snapshot().contextLost===false);await expect(page.locator('#notification')).toBeHidden();
  await page.locator('[data-design="nuevo"]').click();await page.waitForFunction(()=>(window as any).__bano.snapshot().active==='nuevo');
  expect((await page.evaluate(()=>(window as any).__bano.snapshot())).windowOpen).toBe(1);
  expect((await page.evaluate(()=>(window as any).__bano.snapshot())).error).toBeNull();
});
test('Pointer Lock requires click and exits on Escape; drag remains available',async({page})=>{
  await page.goto('/?diseno=original&qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await page.bringToFront();await page.locator('canvas').click({position:{x:640,y:450}});
  expect(await page.evaluate(()=>!!document.pointerLockElement)).toBe(false);await page.locator('#walk').click();
  await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(true);await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(false);
  const before=await page.evaluate(()=>(window as any).__bano.snapshot().quaternion);await page.mouse.move(600,450);await page.mouse.down();await page.mouse.move(740,450,{steps:8});await page.mouse.up();
  expect(await page.evaluate(()=>(window as any).__bano.snapshot().quaternion)).not.toEqual(before);
});
test('fullscreen control enters and leaves when the browser exposes the capability',async({page})=>{
  await page.goto('/?qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  if(!await page.evaluate(()=>document.fullscreenEnabled)){await expect(page.locator('#fullscreen')).toBeHidden();return;}
  await page.bringToFront();await page.locator('#fullscreen').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.locator('#fullscreen').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
});
