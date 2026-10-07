import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validPosition,moveWithCollision,obstacles,intersects } from '../src/navigation/collision.ts';
const layout=JSON.parse(readFileSync(new URL('../public/assets/shared/layout.json',import.meta.url),'utf8'));
test('all public cameras occupy free reachable space',()=>{
  for(const c of Object.values(layout.cameras) as {position:number[]}[])assert(validPosition({x:c.position[0],z:c.position[2]},layout,0));
});
test('long steps cannot tunnel through walls, window, furniture or closed glass',()=>{
  for(const [p,dx,dz] of [[{x:0,z:-1.7},-5,0],[{x:0,z:-1.7},5,0],[{x:0,z:-2.7},0,-8],[{x:0,z:-.8},5,0]] as const){
    const out=moveWithCollision(p,dx,dz,layout,0);assert(validPosition(out,layout,0));assert(Math.hypot(out.x-p.x,out.z-p.z)<3);
  }
});
test('closed glass blocks crossing, sliding leaf opens a real passage',()=>{
  const closed=moveWithCollision({x:0,z:-.73},.85,0,layout,0);assert(closed.x<.3);
  const open=moveWithCollision({x:0,z:-.73},.85,0,layout,1);assert(open.x>.8);
});
test('continuous diagonal sweep stays outside all solids',()=>{
  let p={x:0,z:-.9};
  for(let i=0;i<2000;i++) {p=moveWithCollision(p,Math.cos(i*.02)*.13,Math.sin(i*.016)*.13,layout,0);assert(validPosition(p,layout,0));}
});
test('finite door jambs prevent slipping diagonally through front wall',()=>{
  let p={x:.7,z:-.18};assert(validPosition(p,layout,1));p=moveWithCollision(p,0,2,layout,1);assert(p.z<-.14);
  assert(validPosition(moveWithCollision({x:0,z:-.3},0,1.4,layout,0),layout,0));
});
test('both shower end panes block passage even when the corridor door is open',()=>{
  for(const door of [0,1]){
    const outside={x:.80,z:-.18};assert(validPosition(outside,layout,door));
    const front=moveWithCollision(outside,0,-2,layout,door);assert(front.z>-.21);assert(validPosition(front,layout,door));
    const inside={x:.80,z:-.73};assert(validPosition(inside,layout,door));
    const towardEntry=moveWithCollision(inside,0,2,layout,door);assert(towardEntry.z<-.50);
    const towardWindow=moveWithCollision(inside,0,-3,layout,door);assert(towardWindow.z>-2.0);
  }
});
test('toilet and shower occupy distinct regions',()=>{
  const toilet=obstacles(layout,0).find(o=>o.id==='toilet_shared')!;
  assert(toilet.maxZ<layout.shower.backZ);
  assert(!validPosition({x:.83,z:-2.72},layout,1));
});
test('circle/rectangle collision respects corners and touching tolerance',()=>{
  const r={minX:0,maxX:1,minZ:0,maxZ:1,id:'test'};
  assert(!intersects({x:1.14,z:1.14},r));assert(intersects({x:1.1,z:1.1},r));
});
