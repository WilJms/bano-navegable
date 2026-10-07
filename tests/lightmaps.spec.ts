import {test,expect} from '@playwright/test';

test('both irradiance atlases reach the GPU without low-alpha colour quantization',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // Observe the ACTUAL application uploads, before drawing. Do not use canvas
  // 2D, whose premultiplication would itself discard the RGBM precision.
  await page.addInitScript(()=>{
    const checks:Promise<string>[]=[];(window as any).__irradianceUploads=checks;
    const seen=new WeakSet<object>();
    for(const method of ['texImage2D','texSubImage2D'] as const){
      const original=WebGL2RenderingContext.prototype[method];
      (WebGL2RenderingContext.prototype as any)[method]=function(...args:any[]){
        const result=(original as Function).apply(this,args);
        const source=args.find(x=>(x instanceof HTMLImageElement||x instanceof ImageBitmap)&&x.width===4096&&x.height===4096);
        if(!source||seen.has(source))return result;
        seen.add(source);
        const gl=this as WebGL2RenderingContext,previous=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
        const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.READ_FRAMEBUFFER,framebuffer);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,gl.getParameter(gl.TEXTURE_BINDING_2D),0);
        if(gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Irradiance readback framebuffer incomplete');
        const pixels=new Uint8Array(4096*4096*4);gl.readPixels(0,0,4096,4096,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previous);gl.deleteFramebuffer(framebuffer);
        checks.push(crypto.subtle.digest('SHA-256',pixels).then(bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')));
        return result;
      };
    }
  });
  await page.goto('/?diseno=original&qa=1');
  await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  await page.getByRole('button',{name:'Diseño 2',exact:true}).click();
  await page.waitForFunction(()=>(window as any).__bano.snapshot().active==='nuevo');
  const actual=await page.evaluate(()=>Promise.all((window as any).__irradianceUploads));
  const manifest=await (await page.request.get('/assets/manifest.json')).json();
  const expected=['original','nuevo'].map(d=>manifest.files.find((f:any)=>f.path===`${d}/irradiance.png`).rgbaSha256);
  expect(actual).toEqual(expected);
  expect(errors).toEqual([]);
});

test('an invalid irradiance image preserves the usable design and retry recovers',async({page})=>{
  await page.goto('/?diseno=original');await page.waitForFunction(()=>(window as any).__bano?.snapshot().ready);
  const before=await page.evaluate(()=>(window as any).__bano.snapshot());
  await page.route('**/nuevo/irradiance.png',route=>route.fulfill({status:200,contentType:'image/png',body:'invalid PNG fixture'}));
  await page.getByRole('button',{name:'Diseño 2',exact:true}).click();await expect(page.locator('#retry')).toBeVisible();
  const failed=await page.evaluate(()=>(window as any).__bano.snapshot());
  expect(failed.active).toBe('original');expect(failed.position).toEqual(before.position);expect(failed.error).not.toBeNull();
  await page.unroute('**/nuevo/irradiance.png');await page.locator('#retry').click();
  await page.waitForFunction(()=>(window as any).__bano.snapshot().active==='nuevo');
  expect(await page.evaluate(()=>(window as any).__bano.snapshot().error)).toBeNull();
});
