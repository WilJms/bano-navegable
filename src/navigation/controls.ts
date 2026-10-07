import { Euler, PerspectiveCamera, Vector3 } from 'three';
import { moveWithCollision, type Layout } from './collision';
export class WalkControls {
  private keys = new Set<string>();
  private pointer: { id: number; x: number; y: number } | null = null;
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private stick = { x: 0, y: 0 };
  private yaw = 0;
  private pitch = 0;
  enabled = true;
  constructor(readonly camera: PerspectiveCamera, readonly canvas: HTMLCanvasElement, readonly layout: Layout, private getDoor: () => number) {
    this.sync();
    const movement = ['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    window.addEventListener('keydown', e => {
      if (e.code==='Escape') { document.exitPointerLock?.(); this.stop(); return; }
      if (!this.enabled || (e.target as HTMLElement).closest('button,input,select,dialog')) return;
      if (movement.includes(e.code)) { this.keys.add(e.code); e.preventDefault(); }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.stop());
    document.addEventListener('visibilitychange', () => this.stop());
    document.querySelectorAll('button,select,input').forEach(el => el.addEventListener('pointerdown', () => this.stop()));
    document.addEventListener('pointerlockchange', () => { this.stop(); document.body.classList.toggle('locked', document.pointerLockElement === canvas); });
    canvas.addEventListener('pointerdown', e => {
      if (!this.enabled || this.pointer) return;
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.focus();
    });
    canvas.addEventListener('pointermove', e => {
      if (!this.enabled) return;
      if (document.pointerLockElement === canvas) this.look(e.movementX, e.movementY);
      else if (this.pointer?.id === e.pointerId) {
        this.look(e.clientX - this.pointer.x, e.clientY - this.pointer.y);
        this.pointer.x = e.clientX; this.pointer.y = e.clientY;
      }
    });
    const release = (e: PointerEvent) => { if (this.pointer?.id === e.pointerId) this.pointer = null; };
    canvas.addEventListener('pointerup', release);canvas.addEventListener('pointercancel', release);canvas.addEventListener('lostpointercapture', release);
    const pad = document.querySelector<HTMLElement>('#joystick')!;
    pad.addEventListener('pointerdown', e => {
      if (this.stickId !== null) return;
      this.stickId = e.pointerId; pad.setPointerCapture(e.pointerId);
      const b = pad.getBoundingClientRect(); this.stickOrigin = { x: b.x+b.width/2, y:b.y+b.height/2 }; this.updateStick(e);
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === this.stickId) this.updateStick(e); });
    const releaseStick = (e: PointerEvent) => { if (e.pointerId === this.stickId) {this.stickId=null;this.stick={x:0,y:0};this.drawStick();} };
    pad.addEventListener('pointerup',releaseStick);pad.addEventListener('pointercancel',releaseStick);pad.addEventListener('lostpointercapture',releaseStick);
  }
  private updateStick(e: PointerEvent) {
    let x=(e.clientX-this.stickOrigin.x)/34,y=(e.clientY-this.stickOrigin.y)/34;
    const n=Math.max(1,Math.hypot(x,y)); this.stick={x:x/n,y:y/n}; this.drawStick();
  }
  private drawStick() { document.querySelector<HTMLElement>('#stick')!.style.transform=`translate(${this.stick.x*30}px, ${this.stick.y*30}px)`; }
  look(dx: number, dy: number) { this.yaw-=dx*.0027;this.pitch=Math.max(-1.36,Math.min(1.36,this.pitch-dy*.0027));this.camera.quaternion.setFromEuler(new Euler(this.pitch,this.yaw,0,'YXZ')); }
  sync() { const e=new Euler().setFromQuaternion(this.camera.quaternion,'YXZ');this.pitch=e.x;this.yaw=e.y; }
  stop() { this.keys.clear();this.pointer=null;this.stickId=null;this.stick={x:0,y:0};this.drawStick(); }
  async lock():Promise<boolean> {
    return new Promise(resolve=>{
      const done=(ok:boolean)=>{document.removeEventListener('pointerlockchange',changed);document.removeEventListener('pointerlockerror',failed);clearTimeout(timer);resolve(ok);};
      const changed=()=>done(document.pointerLockElement===this.canvas),failed=()=>done(false);
      const timer=setTimeout(failed,1200);
      document.addEventListener('pointerlockchange',changed);document.addEventListener('pointerlockerror',failed);
      try{this.canvas.requestPointerLock()?.catch(failed);}catch{failed();}
    });
  }
  update(dt: number) {
    if (!this.enabled) return;
    const f=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-this.stick.y;
    const r=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.stick.x;
    const n=Math.max(1,Math.hypot(f,r));const speed=.82*Math.min(dt,.075)/n;
    const dx=(r*Math.cos(this.yaw)-f*Math.sin(this.yaw))*speed;
    const dz=(-r*Math.sin(this.yaw)-f*Math.cos(this.yaw))*speed;
    const p=moveWithCollision(this.camera.position,dx,dz,this.layout,this.getDoor());
    this.camera.position.x=p.x;this.camera.position.z=p.z;
    const shower=p.x>this.layout.shower.glassX && p.z<this.layout.shower.frontZ && p.z>this.layout.shower.backZ;
    const height=1.62+(shower?.062:0);this.camera.position.y+=(height-this.camera.position.y)*Math.min(1,dt*12);
  }
  pose(position: number[], target: number[], fov: number) { this.stop();this.camera.position.fromArray(position);this.camera.lookAt(new Vector3().fromArray(target));this.camera.fov=fov;this.camera.updateProjectionMatrix();this.sync(); }
}
