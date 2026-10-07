import {readFileSync,readdirSync,lstatSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import path from 'node:path';
const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));let total=0;
for(const item of manifest.files){const file=path.join('public/assets',item.path);assert(!lstatSync(file).isSymbolicLink(),file);const b=readFileSync(file);assert.equal(b.length,item.bytes,file);assert.equal(createHash('sha256').update(b).digest('hex'),item.sha256,file);assert(!b.subarray(0,100).toString().includes('git-lfs.github.com'),`LFS pointer: ${file}`);total+=b.length;}
for(const design of ['original','nuevo'])for(const name of ['stone.jpg','wood.jpg','stone-normal.jpg','stone-rough.jpg','irradiance.png'])assert(manifest.files.some(f=>f.path===`${design}/${name}`));
for(const name of ['bano.glb.gz','layout.json','sky.hdr','counter.jpg','wood-normal.jpg','fabric.jpg','fabric-normal.jpg'])assert(manifest.files.some(f=>f.path===`shared/${name}`));
assert.equal(manifest.lightmaps.channel,1);assert.equal(manifest.lightmaps.encoding,'linear RGBM64');assert.equal(manifest.decoders.length,0);
console.log(`PASS — ${manifest.files.length} assets, ${Math.round(total/1024/1024*100)/100} MiB, SHA-256 verified; no external decoders required.`);
