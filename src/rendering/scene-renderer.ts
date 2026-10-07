import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { fetchAsset, texture, type Design, type VariantResources } from '../scene/resources';
export type Quality = 'alto'|'equilibrado'|'ligero';
export const profiles = {
  alto: { dpr: 1.7, mirror: 1024, probe: 128 },
  equilibrado: { dpr: 1.15, mirror: 768, probe: 128 },
  ligero: { dpr: .8, mirror: 384, probe: 64 },
};
type Binding = { mesh: T.Mesh; source: T.MeshStandardMaterial; baked: boolean; name: string };
export class BathroomRenderer {
  readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(71,1,.035,70);
  readonly renderer: T.WebGLRenderer;
  readonly mirrors: Partial<Record<Design,Reflector>>={};
  private root?: T.Group;
  private bindings: Binding[]=[];
  private moving: { object:T.Object3D; z:number }[]=[];
  private windowMoving: { object:T.Object3D; x:number; travel:number }[]=[];
  private variants=new Map<Design,T.Material[]>();
  private sharedMaps: Record<string,T.Texture>={};
  private pmrem: T.PMREMGenerator;
  private probe: T.WebGLCubeRenderTarget;
  private environments=new Map<Design,T.WebGLRenderTarget>();
  private environmentWindowPositions=new Map<Design,number>();
  design: Design='original';quality: Quality='equilibrado';door=0;windowOpen=0;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.90;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;
    this.pmrem=new T.PMREMGenerator(this.renderer);this.probe=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType});
    this.renderer.info.autoReset=false;
    // Outdoor surfaces and moving metal receive direct light. Static diffuse is baked once per design.
    const sun=new T.DirectionalLight(0xfff2dc,2.4);sun.position.set(-3.5,8,-11.2);sun.target.position.set(0,0,-5);
    sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:32});sun.shadow.normalBias=.018;sun.shadow.bias=-.00012;
    this.scene.add(sun,sun.target);
    this.scene.add(new T.HemisphereLight(0xe4efff,0x73804a,.70));
    this.resize();
  }
  async load(progress: (label:string)=>void) {
    const [model,skyBytes,counter,woodNormal,fabric,fabricNormal]=await Promise.all([
      fetchAsset('shared/bano.glb.gz').then(async b=>{progress('Geometría recibida');if(typeof DecompressionStream==='undefined')throw new Error('Este navegador necesita soporte de DecompressionStream para abrir el modelo.');const stream=new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'));const raw=await new Response(stream).arrayBuffer();return new GLTFLoader().parseAsync(raw,'');}),
      fetchAsset('shared/sky.hdr'),texture('shared/counter.jpg'),texture('shared/wood-normal.jpg',true),texture('shared/fabric.jpg'),texture('shared/fabric-normal.jpg',true)
    ]);
    const h=new HDRLoader().parse(skyBytes);const sky=new T.DataTexture(h.data,h.width,h.height,T.RGBAFormat,h.type);
    sky.colorSpace=T.LinearSRGBColorSpace;sky.mapping=T.EquirectangularReflectionMapping;sky.magFilter=T.LinearFilter;sky.minFilter=T.LinearFilter;sky.needsUpdate=true;sky.flipY=true;
    this.scene.background=sky;this.scene.backgroundIntensity=.78;this.sharedMaps={counter,woodNormal,fabric,fabricNormal};
    fabric.repeat.set(2,2);fabricNormal.repeat.set(2,2);
    this.root=model.scene;this.scene.add(model.scene);model.scene.updateMatrixWorld(true);
    const remove:T.Object3D[]=[];
    model.scene.traverse(o=>{
      if(!(o instanceof T.Mesh))return;
      if(o.name.startsWith('reflector_')) {
        const design=o.name.endsWith('nuevo')?'nuevo':'original';const center=new T.Vector3(design==='nuevo'?-1.168:-1.179,design==='nuevo'?1.572:1.575,-1.65);
        const geom=o.geometry.clone().applyMatrix4(o.matrixWorld).translate(-center.x,-center.y,-center.z).rotateY(-Math.PI/2);
        const reflector=new Reflector(geom,{textureWidth:768,textureHeight:768,clipBias:.002,multisample:2});
        const reflectionMaterial=reflector.material as T.ShaderMaterial;
        reflectionMaterial.fragmentShader=reflectionMaterial.fragmentShader.replace('blendOverlay( base.rgb, color )','base.rgb * 0.965');
        reflector.name=`mirror_${design}`;reflector.position.copy(center);reflector.rotation.y=Math.PI/2;
        reflector.userData.variant=design;this.mirrors[design]=reflector;remove.push(o);return;
      }
      let parent:T.Object3D|null=o;let baked=false,exterior=false;
      while(parent){baked ||= !!parent.userData.baked;exterior ||= !!parent.userData.exterior;parent=parent.parent;}
      const material=o.material as T.MeshStandardMaterial;
      if(o.name.startsWith('glass_')||o.name.startsWith('window_glass')) {
        const glass=new T.MeshPhysicalMaterial({name:'stable_clear_glass',color:0xdaf1ed,roughness:.065,metalness:0,transparent:true,opacity:.095,depthWrite:false,side:T.DoubleSide,envMapIntensity:.7,ior:1.48});
        glass.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float glassFresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 5.0);\n diffuseColor.a = mix(0.045, 0.36, glassFresnel);\n #include <opaque_fragment>`);
        };
        glass.customProgramCacheKey=()=> 'clear-glass-fresnel-v1';o.material=glass;o.renderOrder=2;
      } else {
        this.bindings.push({mesh:o,source:material,baked,name:material.name});
      }
      if(o.userData.moving==='sliding')this.moving.push({object:o,z:o.position.z});
      if(o.userData.moving==='window_sliding')this.windowMoving.push({object:o,x:o.position.x,travel:o.userData.travelX});
      o.castShadow=exterior;o.receiveShadow=exterior;
      if(exterior)o.frustumCulled=true;
    });
    remove.forEach(o=>o.removeFromParent());
    Object.values(this.mirrors).forEach(m=>this.scene.add(m));
    progress('Modelo listo');
  }
  private buildMaterials(resources:VariantResources) {
    const existing=this.variants.get(resources.design);if(existing)return existing;
    const cache=new Map<string,T.Material>();
    const materials=this.bindings.map(({source,baked,name})=>{
      const key=`${name}/${baked}`;if(cache.has(key))return cache.get(key)!;
      const m=source.clone();m.name=key;
      if(name==='fern_02'){m.transparent=false;m.alphaTest=.5;m.alphaToCoverage=true;m.depthWrite=true;m.side=T.DoubleSide;}
      if(name.startsWith('leaf')){m.color.multiplyScalar(.60);m.roughness=.85;}
      if(['stone','floor','wood','counter'].includes(name))m.color.set(0xffffff);
      if(name==='stone'||name==='floor') {m.map=resources.stone;m.normalMap=resources.normal;m.normalScale.set(.13,.13);m.roughnessMap=resources.rough;m.roughness=name==='floor'?.64:.90;}
      if(name==='wood'){m.map=resources.wood;m.normalMap=this.sharedMaps.woodNormal;m.normalScale.set(.20,.20);m.roughness=.42;}
      if(name==='counter'){m.map=this.sharedMaps.counter;m.roughness=.24;}
      if(name==='fabric'){m.map=this.sharedMaps.fabric;m.normalMap=this.sharedMaps.fabricNormal;m.normalScale.set(.28,.28);m.roughness=.96;}
      if(name==='metal'){m.color.set(resources.design==='nuevo'?0x242522:0xdfe4e8);m.metalness=resources.design==='nuevo'?0:1;m.roughness=resources.design==='nuevo'?.30:.17;}
      if(name==='mirror') {m.metalness=1;m.roughness=.05;}
      if(baked && name!=='window_white' && name!=='white') {
        if(!this.bindings.find(b=>b.name===name&&b.baked)?.mesh.geometry.getAttribute('uv1'))throw new Error(`Falta UV de iluminación: ${name}`);
        m.lightMap=resources.lightmap;m.lightMapIntensity=Math.PI;
        // Cycles DIFFUSE, color OFF: outgoing diffuse radiance at unit albedo.
        // Three's Lambert BRDF is 1/pi. Convert to irradiance exactly once.
        const halo=resources.design==='nuevo'&&name==='stone';
        m.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>','irradiance = vec3(0.0);\n'+T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','iblIrradiance += vec3(0.0);').replace('lightMapTexel.rgb * lightMapIntensity','lightMapTexel.rgb * lightMapTexel.a * 64.0 * lightMapIntensity'));
          if(halo){
            shader.vertexShader='varying vec3 vHaloWorld;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vHaloWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
            shader.fragmentShader='varying vec3 vHaloWorld;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`float haloR = length(vHaloWorld.yz - vec2(1.572, -1.65));\n float haloPlane = 1.0 - smoothstep(0.002, 0.018, abs(vHaloWorld.x + 1.2155));\n irradiance += vec3(1.0, 0.61, 0.29) * 8.0 * exp(-pow((haloR - 0.548) / 0.065, 2.0)) * haloPlane;\n #include <lights_fragment_end>`);
          }
          shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directDiffuse = vec3(0.0);');
        };m.customProgramCacheKey=()=> `cycles-diffuse-irradiance-v2-${halo}`;
      }
      m.envMapIntensity=name==='metal'?1.0:.55;m.needsUpdate=true;cache.set(key,m);return m;
    });this.variants.set(resources.design,materials);return materials;
  }
  apply(resources:VariantResources) {
    const material=this.buildMaterials(resources);
    this.bindings.forEach((b,i)=>b.mesh.material=material[i]);
    this.root!.traverse(o=>{if(o.userData.variant)o.visible=o.userData.variant===resources.design;});
    for(const d of ['original','nuevo'] as Design[])this.mirrors[d]!.visible=d===resources.design;
    this.design=resources.design;
    this.renderer.compile(this.scene,this.camera);
    if(!this.environments.has(resources.design)||this.environmentWindowPositions.get(resources.design)!==this.windowOpen)this.captureEnvironment(resources.design);
    this.scene.environment=this.environments.get(resources.design)!.texture;
    this.render();
  }
  private captureEnvironment(design:Design) {
    const hidden:T.Object3D[]=[];
    this.scene.traverse(o=>{if(o instanceof Reflector || (o instanceof T.Mesh && (o.material as T.Material).transparent)) {if(o.visible){hidden.push(o);o.visible=false;}}});
    this.scene.environment=null;
    const cam=new T.CubeCamera(.04,60,this.probe);cam.position.set(-.15,1.35,-1.7);this.scene.add(cam);
    cam.update(this.renderer,this.scene);
    const env=this.pmrem.fromCubemap(this.probe.texture);this.environments.get(design)?.dispose();this.environments.set(design,env);this.environmentWindowPositions.set(design,this.windowOpen);
    cam.removeFromParent();hidden.forEach(o=>o.visible=true);
  }
  setDoor(value:number) {this.door=value;this.moving.forEach(({object,z})=>object.position.z=z-.85*value);}
  setWindowOpen(value:number) {this.windowOpen=T.MathUtils.clamp(value,0,1);this.windowMoving.forEach(({object,x,travel})=>object.position.x=x+travel*this.windowOpen);}
  finishWindowMovement() {this.captureEnvironment(this.design);this.scene.environment=this.environments.get(this.design)!.texture;}
  windowInfo() {return this.windowMoving.map(({object,x,travel})=>({name:object.name,position:object.position.toArray(),closedX:x,travel}));}
  restoreEnvironment() {this.environments.forEach(e=>e.dispose());this.environments.clear();this.environmentWindowPositions.clear();this.pmrem.dispose();this.pmrem=new T.PMREMGenerator(this.renderer);this.renderer.shadowMap.needsUpdate=true;}
  setQuality(q:Quality) {this.quality=q;const p=profiles[q];Object.values(this.mirrors).forEach(m=>{const rt=m.getRenderTarget();const samples=q==='alto'?4:q==='equilibrado'?2:0;if(rt.samples!==samples){rt.samples=samples;rt.dispose();}rt.setSize(p.mirror,p.mirror);});this.resize();}
  resize() {const p=profiles[this.quality];this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,p.dpr));this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  render() {this.renderer.info.reset();this.renderer.render(this.scene,this.camera);}
  info() {const gl=this.renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),memory:{...this.renderer.info.memory},render:{...this.renderer.info.render},programs:this.renderer.info.programs?.length,dpr:this.renderer.getPixelRatio(),resolution:[this.canvas.width,this.canvas.height]};}
}
