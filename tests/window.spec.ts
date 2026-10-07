import {test,expect} from '@playwright/test';
const state=(page:any)=>page.evaluate(()=>(window as any).__bano.snapshot());
test('design buttons retain swatches and expose only Diseño 1 and Diseño 2',async({page})=>{
  await page.goto('/?diseno=original');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await expect(page.locator('[data-design="original"]')).toHaveText('Diseño 1');
  await expect(page.locator('[data-design="nuevo"]')).toHaveText('Diseño 2');
  await expect(page.locator('.designs .swatch')).toHaveCount(2);
  await page.getByRole('button',{name:'Diseño 2',exact:true}).click();
  await expect.poll(async()=>(await state(page)).active).toBe('nuevo');
  await expect(page.getByRole('button',{name:'Diseño 2',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('whole window sash slides, survives design changes and reverses without moving the camera',async({page})=>{
  await page.goto('/?diseno=original&qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await page.evaluate(async()=>{await (window as any).__bano.chooseDesign('nuevo');await (window as any).__bano.chooseDesign('original');});
  const before=await state(page);expect(before.windowParts).toHaveLength(8);
  await page.getByRole('button',{name:'Abrir ventana',exact:true}).click();
  await expect.poll(async()=>(await state(page)).windowOpen).toBe(1);
  const opened=await state(page);
  for(const key of ['position','quaternion','fov','quality','door'])expect(opened[key]).toEqual(before[key]);
  for(const [i,part] of opened.windowParts.entries()){
    expect(part.position[0]-before.windowParts[i].position[0]).toBeCloseTo(part.travel,8);
    expect(part.position.slice(1)).toEqual(before.windowParts[i].position.slice(1));
  }
  await expect(page.locator('#window')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-design="nuevo"]').click();await expect.poll(async()=>(await state(page)).active).toBe('nuevo');
  expect((await state(page)).windowParts).toEqual(opened.windowParts);
  await page.locator('#window').click();await expect.poll(async()=>(await state(page)).windowOpen).toBe(0);
  expect((await state(page)).windowParts).toEqual(before.windowParts);
  // A new click during travel reverses the current motion instead of jumping or queuing stale actions.
  await page.locator('#window').click();await page.waitForTimeout(160);
  const intermediate=await state(page);expect(intermediate.windowOpen).toBeGreaterThan(0);expect(intermediate.windowOpen).toBeLessThan(1);
  await page.locator('#window').click();await expect.poll(async()=>(await state(page)).windowOpen).toBe(0);
  const end=await state(page);expect(end.windowParts).toEqual(before.windowParts);expect(end.renderLoops).toBe(1);expect(end.error).toBeNull();
  expect(end.memory.geometries).toBe(opened.memory.geometries);expect(end.memory.textures).toBeLessThanOrEqual(opened.memory.textures);
});
test('window control is usable without overlapping the other controls on mobile sizes',async({page})=>{
  await page.goto('/?diseno=nuevo');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);await expect(page.locator('#window')).toBeVisible();
    const bounds=await page.locator('#window').boundingBox();expect(bounds!.y).toBeGreaterThan(0);expect(bounds!.y+bounds!.height).toBeLessThan(viewport.height);
    for(const selector of ['#shower','#joystick','.bottom','.touch-look']){
      if(!await page.locator(selector).isVisible())continue;
      const b=await page.locator(selector).boundingBox();const overlap=bounds!.x<b!.x+b!.width&&bounds!.x+bounds!.width>b!.x&&bounds!.y<b!.y+b!.height&&bounds!.y+bounds!.height>b!.y;
      expect(overlap,`window overlaps ${selector} at ${viewport.width}x${viewport.height}`).toBe(false);
    }
    await page.locator('#window').press('Enter');await expect.poll(async()=>(await state(page)).windowOpen).toBe(1);
    await page.locator('#window').press('Enter');await expect.poll(async()=>(await state(page)).windowOpen).toBe(0);
  }
});
