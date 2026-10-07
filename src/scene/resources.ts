import { Texture, RepeatWrapping, SRGBColorSpace, NoColorSpace, ClampToEdgeWrapping } from 'three';
export type Design = 'original' | 'nuevo';
export type Progress = (loaded: number, total: number, label: string) => void;
export const assetUrl = (path: string) => new URL(`${import.meta.env.BASE_URL}assets/${path}`, document.baseURI).href;
export async function fetchAsset(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response=await fetch(assetUrl(path),{signal});
  if(!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status}).`);
  const type=response.headers.get('content-type')||'';
  if(type.includes('text/html')) throw new Error(`El servidor devolvió HTML en lugar de ${path}.`);
  return response.arrayBuffer();
}
export async function texture(path: string, data=false, signal?: AbortSignal): Promise<Texture> {
  const bytes=await fetchAsset(path,signal);
  const img=await createImageBitmap(new Blob([bytes]),{premultiplyAlpha:'none',imageOrientation:'none'});
  if(signal?.aborted) {img.close();throw new DOMException('Cancelled','AbortError');}
  const t=new Texture(img); t.flipY=false;t.colorSpace=data?NoColorSpace:SRGBColorSpace;t.wrapS=t.wrapT=RepeatWrapping;t.anisotropy=8;t.needsUpdate=true;
  return t;
}
export interface VariantResources { design: Design; stone: Texture; wood: Texture; normal: Texture; rough: Texture; lightmap: Texture; }
async function irradianceTexture(path: string, signal?: AbortSignal): Promise<Texture> {
  const bytes=await fetchAsset(path,signal);
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  const img=new Image();img.decoding='async';img.src=url;
  try {
    await img.decode();signal?.throwIfAborted();
    // RGBM alpha stores radiance, not transparency. WebKit's ImageBitmap path
    // quantizes low-alpha RGB through premultiplication, even with 'none'.
    // HTMLImageElement + unpremultiplied GPU upload preserves every PNG byte.
    const t=new Texture(img);t.flipY=false;t.premultiplyAlpha=false;t.colorSpace=NoColorSpace;
    t.channel=1;t.wrapS=t.wrapT=ClampToEdgeWrapping;t.anisotropy=8;t.needsUpdate=true;
    return t;
  } finally {URL.revokeObjectURL(url);}
}
export async function loadVariant(design: Design, progress: Progress, signal?: AbortSignal): Promise<VariantResources> {
  let done=0;
  const work=[texture(`${design}/stone.jpg`,false,signal),texture(`${design}/wood.jpg`,false,signal),texture(`${design}/stone-normal.jpg`,true,signal),texture(`${design}/stone-rough.jpg`,true,signal),
    irradianceTexture(`${design}/irradiance.png`,signal)];
  const result=await Promise.allSettled(work.map(async p=>{const t=await p;progress(++done,work.length,`Preparando ${design==='original'?'Original':'Nuevo'}`);return t;}));
  const error=result.find(r=>r.status==='rejected');
  if(error?.status==='rejected') {for(const r of result) if(r.status==='fulfilled') disposeTexture(r.value);throw error.reason;}
  const t=result.map(r=>(r as PromiseFulfilledResult<Texture>).value);
  return {design,stone:t[0],wood:t[1],normal:t[2],rough:t[3],lightmap:t[4]};
}
export function disposeTexture(t: Texture) {t.dispose();const img=t.image as ImageBitmap|undefined;if(img && 'close' in img)img.close();}
