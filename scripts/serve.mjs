// Strict static HTTP server: no SPA fallback. Serves the SAME dist at / and /prueba-bano/.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.SERVE_DIR||'dist'),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.gz':'application/gzip','.png':'image/png','.jpg':'image/jpeg','.hdr':'application/octet-stream','.exr':'application/octet-stream','.wasm':'application/wasm'};
const server=http.createServer(async(req,res)=>{
  try{
    let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(name==='/prueba-bano'){res.writeHead(301,{location:'/prueba-bano/'});res.end();return;}
    name=name.replace(/^\/prueba-bano\//,'/');let file=path.resolve(root,'.'+name);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Length':body.length});res.end(body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Production: http://127.0.0.1:${port} · prefix /prueba-bano/ · ${root}`));
