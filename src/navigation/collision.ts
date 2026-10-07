export type Point = { x: number; z: number };
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number; id: string };
export interface Layout {
  room: { width_x: number; length_along_negative_z: number };
  anchors: Record<string, { position: number[]; size: number[] | null }>;
  shower: { glassX: number; frontZ: number; backZ: number; travel: number };
}
export const PLAYER_RADIUS = .145;
export function obstacles(layout: Layout, door: number): Rect[] {
  const a = layout.anchors;
  const result: Rect[] = ['cabinet_left_half_closed', 'cabinet_right_open', 'vanity_center', 'toilet_shared'].map(id => {
    const { position: p, size: s } = a[id];
    return { id, minX: p[0] - s![0] / 2 - .025, maxX: p[0] + s![0] / 2 + .025, minZ: p[2] - s![2] / 2, maxZ: p[2] + s![2] / 2 };
  });
  const { glassX: x, frontZ: f, backZ: b, travel } = layout.shower;
  const mid = (f + b) / 2;
  result.push({ id: 'glass_fixed', minX: x - .006, maxX: x + .006, minZ: b, maxZ: mid + .015 });
  result.push({ id: 'glass_sliding', minX: x - .025, maxX: x - .011, minZ: mid - .015 + travel * door, maxZ: f + .015 + travel * door });
  result.push({ id: 'glass_return', minX: x, maxX: layout.room.width_x / 2, minZ: b - .006, maxZ: b + .006 });
  result.push({ id: 'glass_front_return', minX: x, maxX: layout.room.width_x / 2, minZ: f - .006, maxZ: f + .006 });
  result.push({ id: 'shower_front_post', minX: x - .01, maxX: x + .01, minZ: f - .01, maxZ: f + .01 });
  const entry=a.entry_door_shared.position;
  result.push({ id: 'entry_door', minX: entry[0]-.04, maxX: entry[0]+.04, minZ: entry[2]-.42, maxZ: entry[2]+.42 });
  return result;
}
export function intersects(p: Point, box: Rect, radius = PLAYER_RADIUS): boolean {
  const x = Math.max(box.minX, Math.min(box.maxX, p.x));
  const z = Math.max(box.minZ, Math.min(box.maxZ, p.z));
  return (p.x - x) ** 2 + (p.z - z) ** 2 < radius ** 2;
}
export function validPosition(p: Point, layout: Layout, door: number, radius = PLAYER_RADIUS): boolean {
  const half = layout.room.width_x / 2;
  if (p.z < -layout.room.length_along_negative_z + radius || p.z > 1.82) return false;
  if (p.z <= 0 && Math.abs(p.x) > half - radius) return false;
  if (p.z > 0 && Math.abs(p.x) > .98 - radius) return false;
  // Finite thickness of entrance wall and inner jambs.
  if (p.z > -radius && p.z < .12 + radius && Math.abs(p.x) > .4 - radius) return false;
  return !obstacles(layout, door).some(r => intersects(p, r, radius));
}
export function moveWithCollision(p: Point, dx: number, dz: number, layout: Layout, door: number): Point {
  // Substeps bound travel to 1/5 the player radius; diagonal axis sliding avoids tunnelling.
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .025));
  let out = { ...p };
  for (let i = 0; i < n; i++) {
    const full = { x: out.x + dx / n, z: out.z + dz / n };
    if (validPosition(full, layout, door)) { out = full; continue; }
    const x = { x: full.x, z: out.z };
    if (validPosition(x, layout, door)) out = x;
    const z = { x: out.x, z: full.z };
    if (validPosition(z, layout, door)) out = z;
  }
  return out;
}
