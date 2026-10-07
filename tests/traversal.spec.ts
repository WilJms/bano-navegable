import {test,expect} from '@playwright/test';
for(const design of ['original','nuevo'])test(`${design}: closed glass blocks walking and opening permits real shower entry`,async({page})=>{
  await page.goto(`/?diseno=${design}&qa=1`);await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  const pose=()=>page.evaluate(()=>(window as any).__bano.pose([0,1.62,-.73],[1,1.62,-.73],70));
  await pose();await page.locator('canvas').focus();await page.keyboard.down('w');await page.waitForTimeout(1200);await page.keyboard.up('w');
  const closed=await page.evaluate(()=>(window as any).__bano.snapshot());expect(closed.position[0]).toBeLessThan(.23);expect(closed.position[0]).toBeGreaterThan(.14);
  await page.locator('#shower').click();await expect.poll(()=>page.evaluate(()=>(window as any).__bano.snapshot().door)).toBe(1);
  await page.locator('canvas').focus();await page.keyboard.down('w');await page.waitForTimeout(850);await page.keyboard.up('w');
  const inside=await page.evaluate(()=>(window as any).__bano.snapshot());expect(inside.position[0]).toBeGreaterThan(.75);expect(inside.position[1]).toBeGreaterThan(1.67);
  await page.evaluate(()=>(window as any).__bano.pose([.375,1.68,-.73],[0,1.68,-.73],70));
  await page.locator('#shower').click();await page.waitForTimeout(850);await expect(page.locator('#notice-text')).toContainText('ocupado');
  expect(await page.evaluate(()=>{const s=(window as any).__bano.snapshot();return (window as any).__bano.validPosition(s.position[0],s.position[2]);})).toBe(true);
});
test('denied pointer capture retains drag navigation and explains the alternative',async({page})=>{
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.reject(new DOMException('Test rejection','NotAllowedError'));});
  await page.goto('/?qa=1');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);await page.locator('#walk').click();
  await expect(page.locator('#notice-text')).toContainText('arrastrando');expect(await page.evaluate(()=>!!document.pointerLockElement)).toBe(false);
  const before=await page.evaluate(()=>(window as any).__bano.snapshot().quaternion);
  await page.mouse.move(600,440);await page.mouse.down();await page.mouse.move(780,470,{steps:10});await page.mouse.up();
  expect(await page.evaluate(()=>(window as any).__bano.snapshot().quaternion)).not.toEqual(before);
});
