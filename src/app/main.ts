import '../ui/style.css';
import { BathroomRenderer, type Quality } from '../rendering/scene-renderer';
import { fetchAsset, loadVariant, type Design, type VariantResources } from '../scene/resources';
import { WalkControls } from '../navigation/controls';
import { validPosition, type Layout } from '../navigation/collision';
interface FullLayout extends Layout { cameras:Record<string,{position:number[];target:number[];fov:number}>; }
const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const canvas=$<HTMLCanvasElement>('#scene');
const notice=$('#notification'), noticeText=$('#notice-text'), retry=$<HTMLButtonElement>('#retry'), cancel=$<HTMLButtonElement>('#cancel');
let app:BathroomRenderer, controls:WalkControls, layout:FullLayout;
let ready=false, requestId=0, pending:AbortController|undefined, requested:Design='original', doorTarget=0, windowTarget=0, qualityMode='auto',contextLost=false,routeStart:number|null=null;
const cache=new Map<Design,VariantResources>();
const frames:number[]=[];let last=performance.now(),adaptiveTime=0,adaptiveCount=0,slowFrames=0;
const status={active:'original' as Design,requested:'original' as Design,loading:true,error:null as string|null};
function message(text:string,error=false,busy=false) {noticeText.textContent=text;notice.hidden=false;retry.hidden=!error;cancel.hidden=!busy;}
function safeRead(key:string) {try{return localStorage.getItem(key);}catch{return null;}}
function safeWrite(key:string,v:string) {try{localStorage.setItem(key,v);}catch{/* Private browsing must not block the room. */}}
const query=new URLSearchParams(location.search);
const initialValue=query.has('diseno')?query.get('diseno'):safeRead('bano-design');
const initial:Design=initialValue==='nuevo'?'nuevo':'original';
function updateUI() {
  document.querySelectorAll<HTMLButtonElement>('[data-design]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.design===status.active)));
  $('#finish-label').textContent=status.active==='original'?'Arena, madera y cromo':'Piedra, madera y negro';
  const url=new URL(location.href);url.searchParams.set('diseno',status.active);history.replaceState(null,'',url);
  safeWrite('bano-design',status.active);
}
async function chooseDesign(design:Design) {
  const id=++requestId;pending?.abort();pending=new AbortController();const signal=pending.signal;
  requested=design;status.requested=design;status.error=null;controls?.stop();
  if(ready&&design===status.active){status.loading=false;notice.hidden=true;return;}
  status.loading=true;
  if(ready)message(`Cargando ${design==='original'?'Diseño 1':'Diseño 2'}…`,false,true);
  try {
    let resources=cache.get(design);
    if(!resources)resources=await loadVariant(design,(n,total,label)=>{
      if(id!==requestId)return;
      if(ready)message(`${label} · ${n}/${total} recursos`,false,true);
      else {$<HTMLProgressElement>('#progress').max=total;$<HTMLProgressElement>('#progress').value=n;$('#progress-count').textContent=`${n} de ${total} recursos de acabado`;}
    },signal);
    if(id!==requestId||signal.aborted)return;
    cache.set(design,resources);
    // A synchronous commit contains material, mirror, lightmap and reflection-probe replacement.
    // The current canvas remains visible throughout fetching; the selected label changes last.
    app.apply(resources);status.active=design;status.loading=false;ready=true;
    updateUI();notice.hidden=true;$('#loading').classList.add('hidden');
  }catch(error){
    if(id!==requestId||signal.aborted)return;
    status.loading=false;status.error=error instanceof Error?error.message:String(error);
    message(`No se pudo preparar el diseño. ${status.error}`,true,false);
    if(!ready){$('#loading-label').textContent='La carga se ha interrumpido. Puedes reintentar.';$<HTMLProgressElement>('#progress').removeAttribute('value');}
  }
}
async function setView(id:string) {
  const p=layout.cameras[id];if(!p)return;
  if(!validPosition({x:p.position[0],z:p.position[2]},layout,app.door))throw new Error(`Vista insegura: ${id}`);
  controls.stop();const fade=$('#view-fade');const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){fade.classList.add('active');await new Promise(r=>setTimeout(r,125));}
  controls.pose(p.position,p.target,p.fov);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.view===id)));
  fade.classList.remove('active');
}
function setQuality(mode:string) {
  qualityMode=mode;const q:Quality=mode==='auto'?(matchMedia('(pointer:coarse)').matches?'ligero':'alto'):mode as Quality;
  app.setQuality(q);$<HTMLSelectElement>('#quality').value=mode;$('#auto-profile').textContent=mode==='auto'?q:'';
}
function toggleDoor() {controls.stop();doorTarget=doorTarget>.5?0:1;}
function doorUI() {const open=doorTarget>.5;$('#shower').setAttribute('aria-pressed',String(open));$('#shower span').textContent=open?'Cerrar mampara':'Abrir mampara';}
function toggleWindow() {controls.stop();windowTarget=windowTarget>.5?0:1;$('#window').setAttribute('aria-pressed',String(windowTarget===1));$('#window span').textContent=windowTarget?'Cerrar ventana':'Abrir ventana';}
function tick(now:number) {
  requestAnimationFrame(tick);const elapsed=now-last;const dt=Math.min(elapsed/1000,.075);last=now;
  if(!ready||document.hidden||contextLost)return;
  if(elapsed>0) {frames.push(elapsed);if(frames.length>10000)frames.shift();}
  if(routeStart!==null){const t=(now-routeStart)/1000;app.camera.position.set(-.12+.12*Math.sin(t*.21),1.62,-1.65+1.08*Math.sin(t*.30));app.camera.rotation.set(.05*Math.sin(t*.4),t*.16,0,'YXZ');}
  else controls.update(dt);
  if(Math.abs(app.door-doorTarget)>.001){
    const next=app.door+Math.sign(doorTarget-app.door)*Math.min(Math.abs(doorTarget-app.door),dt*1.35);
    if(validPosition(app.camera.position,layout,next))app.setDoor(next);
    else{doorTarget=app.door;message('El paso está ocupado. Aléjate de la hoja para cerrarla.');}
    doorUI();
  }
  if(app.windowOpen!==windowTarget){
    const delta=windowTarget-app.windowOpen;
    app.setWindowOpen(Math.abs(delta)<=dt*1.1?windowTarget:app.windowOpen+Math.sign(delta)*dt*1.1);
    if(app.windowOpen===windowTarget)app.finishWindowMovement();
  }
  app.render();
  if(qualityMode==='auto'){
    adaptiveTime+=dt;adaptiveCount++;if(elapsed>42)slowFrames++;
    if(adaptiveTime>8){if(slowFrames/adaptiveCount>.7&&app.quality!=='ligero'){const lower=app.quality==='alto'?'equilibrado':'ligero';app.setQuality(lower);$('#auto-profile').textContent=lower;}adaptiveTime=0;adaptiveCount=0;slowFrames=0;}
  }
}
async function start() {
  try {
    app=new BathroomRenderer(canvas);
    const [data]=await Promise.all([fetchAsset('shared/layout.json'),app.load(label=>$('#loading-label').textContent=label)]);
    layout=JSON.parse(new TextDecoder().decode(data));
    controls=new WalkControls(app.camera,canvas,layout,()=>app.door);
    controls.pose(layout.cameras.diagonal.position,layout.cameras.diagonal.target,layout.cameras.diagonal.fov);
    setQuality('auto');
    document.querySelectorAll<HTMLButtonElement>('[data-design]').forEach(b=>b.addEventListener('click',()=>void chooseDesign(b.dataset.design as Design)));
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>void setView(b.dataset.view!)));
    $('#reset').addEventListener('click',()=>void setView('diagonal'));
    $<HTMLSelectElement>('#quality').addEventListener('change',e=>{controls.stop();setQuality((e.target as HTMLSelectElement).value);});
    $('#shower').addEventListener('click',()=>{toggleDoor();doorUI();});
    $('#window').addEventListener('click',toggleWindow);
    $('#walk').addEventListener('click',async()=>{if(!await controls.lock())message('Puedes mirar arrastrando sobre el baño y caminar con WASD.');canvas.focus();});
    const dialog=$<HTMLDialogElement>('#help-dialog');
    $('#help').addEventListener('click',()=>{controls.stop();controls.enabled=false;document.exitPointerLock?.();dialog.showModal();});
    const closeHelp=()=>{dialog.close();controls.enabled=true;canvas.focus();};
    $('#close-help').addEventListener('click',closeHelp);$('#understood').addEventListener('click',closeHelp);dialog.addEventListener('close',()=>{controls.enabled=true;controls.stop();});
    $('#fullscreen').hidden=!document.fullscreenEnabled;
    $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('Este navegador no permitió pantalla completa.');}});
    window.addEventListener('resize',()=>{controls.stop();app.resize();});
    retry.addEventListener('click',()=>void chooseDesign(requested));
    cancel.addEventListener('click',()=>{++requestId;pending?.abort();status.loading=false;status.requested=status.active;notice.hidden=true;});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;controls.stop();message('Se perdió el contexto gráfico. Recuperando…');});
    canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;app.restoreEnvironment();app.apply(cache.get(status.active)!);notice.hidden=true;last=performance.now();});
    requestAnimationFrame(tick);
    // Read-only production diagnostics; control hooks exist only when explicitly opening ?qa=1.
    const snapshot=()=>({ ...status,ready,contextLost,position:app.camera.position.toArray(),quaternion:app.camera.quaternion.toArray(),fov:app.camera.fov,quality:app.quality,qualityMode,door:app.door,doorTarget,windowOpen:app.windowOpen,windowTarget,windowParts:app.windowInfo(),mirrors:{original:app.mirrors.original?.visible,nuevo:app.mirrors.nuevo?.visible},...app.info(),renderLoops:1});
    Object.assign(window,{__bano:{snapshot,frameTimes:()=>[...frames],layout}});
    if(query.get('qa')==='1')Object.assign((window as unknown as {__bano:object}).__bano,{chooseDesign,setView,setQuality,clearFrames:()=>frames.splice(0),toggleDoor,toggleWindow,startRoute:()=>{controls.stop();frames.splice(0);routeStart=performance.now();},stopRoute:()=>{routeStart=null;controls.sync();},pose:(position:number[],target:number[],fov:number)=>{if(!validPosition({x:position[0],z:position[2]},layout,app.door))throw new Error('Unsafe QA pose');controls.pose(position,target,fov);},look:(x:number,y:number)=>controls.look(x,y),validPosition:(x:number,z:number,d=app.door)=>validPosition({x,z},layout,d)});
    await chooseDesign(initial);
  }catch(error){
    status.error=error instanceof Error?error.message:String(error);status.loading=false;
    $('#loading h1').textContent='No se pudo abrir el recorrido';$('#loading-label').textContent=status.error;
    message('Comprueba que tu navegador permite WebGL 2 y vuelve a intentarlo.',true);retry.onclick=()=>location.reload();
  }
}
void start();
