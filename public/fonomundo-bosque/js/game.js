
import * as THREE from "../vendor/three.module.js";
import { GLTFLoader } from "../vendor/addons/loaders/GLTFLoader.js";
import { STR } from "../strings.js";

// ============================ CONFIG / THRESHOLDS ============================
const DPR_CAP = 1.5;
const STEP = 1000/60;
const DAY_LENGTH = 120;          // seconds for full day+night cycle
const HUNGER_DRAIN = 100/110;    // ~110s to starve when unfed
const WARMTH_DRAIN_NIGHT = 100/70;
const WARMTH_REGAIN = 100/20;
const WORLD = 90;                // half-extent of play field
const TREE_N = 26, ROCK_N = 14, BUSH_N = 12;
const COSTS = { fire:{wood:5}, wall:{wood:3,stone:2}, chest:{wood:4} };
const GATHER = { tree:{res:"wood",amt:3,hits:3}, rock:{res:"stone",amt:2,hits:4}, bush:{res:"berries",amt:2,hits:1} };

// ============================ DETERMINISTIC RNG =============================
let _seed = 1337;
function rng(){ _seed = (_seed*1664525 + 1013904223) >>> 0; return _seed/4294967296; }
function rand(a,b){ return a + (b-a)*rng(); }

// ============================ STATE =========================================
const S = {
  wood:0, stone:0, berries:0,
  hunger:100, warmth:100,
  day:1, t:DAY_LENGTH*0.25,   // start mid-morning
  dead:false, started:false, paused:false,
  nearTarget:null, builds:[], nearFire:false,
};

// ============================ RENDERER / SCENE ==============================
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio||1, DPR_CAP));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86efac);
scene.fog = new THREE.Fog(0x86efac, 60, 150);

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 400);

// lighting
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x4a4030, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d0, 2.0);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
const sc = 60; sun.shadow.camera.left=-sc; sun.shadow.camera.right=sc; sun.shadow.camera.top=sc; sun.shadow.camera.bottom=-sc;
sun.shadow.bias = -0.0008;
scene.add(sun); scene.add(sun.target);
const moon = new THREE.DirectionalLight(0x9fb6ff, 0.0); scene.add(moon);

// ============================ TEXTURE LOADER ================================
const texLoader = new THREE.TextureLoader();
function pbr(name, repeat, rough=1.0, roughScalar=1.0){
  const base = texLoader.load(`./assets/textures/${name}_basecolor.png`);
  const nrm  = texLoader.load(`./assets/textures/${name}_normal.png`);
  const rgh  = texLoader.load(`./assets/textures/${name}_rough.png`);
  for(const t of [base,nrm,rgh]){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat,repeat); t.anisotropy=4; }
  base.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map:base, normalMap:nrm, roughnessMap:rgh, roughness:roughScalar, metalness:0.0 });
}

// ============================ GROUND ========================================
const groundMat = pbr("grass", WORLD/3, 1.0, 1.0);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD*2, WORLD*2, 1,1), groundMat);
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
scene.add(ground);

// materials for props
const barkMat = pbr("bark",1.5,1,0.95);
const foliageMat = pbr("foliage",1,1,0.9);
const rockMat = pbr("rock",1,1,0.85);
const plankMat = pbr("plank",1,1,0.9);
const thatchMat = pbr("thatch",1,1,0.95);

// ============================ NODES (instanced) =============================
// Trees: trunk (cyl) + canopy (cone), instanced. Rocks: icosahedron instanced. Bushes: sphere instanced.
const nodes = []; // {type, pos, hits, alive, idx}
const dummy = new THREE.Object3D();

const trunkGeo = new THREE.CylinderGeometry(0.45,0.6,5,7); trunkGeo.translate(0,2.5,0);
const canopyGeo = new THREE.ConeGeometry(2.6,5,8); canopyGeo.translate(0,6.5,0);
const trunkMesh = new THREE.InstancedMesh(trunkGeo, barkMat, TREE_N);
const canopyMesh = new THREE.InstancedMesh(canopyGeo, foliageMat, TREE_N);
trunkMesh.castShadow = canopyMesh.castShadow = true;
trunkMesh.receiveShadow = canopyMesh.receiveShadow = true;
scene.add(trunkMesh, canopyMesh);

const rockGeo = new THREE.IcosahedronGeometry(1.3,0);
const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_N);
rockMesh.castShadow = rockMesh.receiveShadow = true; scene.add(rockMesh);

const bushGeo = new THREE.IcosahedronGeometry(1.0,1);
const bushMesh = new THREE.InstancedMesh(bushGeo, foliageMat, BUSH_N);
bushMesh.castShadow = true; scene.add(bushMesh);
// berry dots material reused as small red instanced spheres
const berryGeo = new THREE.SphereGeometry(0.14,6,6);
const berryMat = new THREE.MeshStandardMaterial({color:0xc0303a, emissive:0x3a0808, roughness:0.6});
const berryMesh = new THREE.InstancedMesh(berryGeo, berryMat, BUSH_N*4);
scene.add(berryMesh);

function placeInstanced(){
  let ti=0, ri=0, bi=0, berryI=0;
  const used=[];
  function farEnough(x,z,d){ for(const u of used){ if((u.x-x)**2+(u.z-z)**2 < d*d) return false; } return true; }
  function spot(d){ let x,z,tries=0; do{ x=rand(-WORLD+8,WORLD-8); z=rand(-WORLD+8,WORLD-8); tries++; } while((x*x+z*z<100 || !farEnough(x,z,d)) && tries<40); used.push({x,z}); return {x,z}; }
  for(let i=0;i<TREE_N;i++){ const p=spot(6); const s=rand(0.85,1.3); const ry=rand(0,6.28);
    dummy.position.set(p.x,0,p.z); dummy.rotation.set(0,ry,0); dummy.scale.setScalar(s); dummy.updateMatrix();
    trunkMesh.setMatrixAt(ti,dummy.matrix); canopyMesh.setMatrixAt(ti,dummy.matrix);
    nodes.push({type:"tree",x:p.x,z:p.z,r:1.4,hits:GATHER.tree.hits,alive:true,mesh:[trunkMesh,canopyMesh],idx:ti,scale:s,ry}); ti++; }
  for(let i=0;i<ROCK_N;i++){ const p=spot(5); const s=rand(0.9,1.6); const ry=rand(0,6.28);
    dummy.position.set(p.x,0.6*s,p.z); dummy.rotation.set(rand(0,1),ry,rand(0,1)); dummy.scale.setScalar(s); dummy.updateMatrix();
    rockMesh.setMatrixAt(ri,dummy.matrix);
    nodes.push({type:"rock",x:p.x,z:p.z,r:1.4*s,hits:GATHER.rock.hits,alive:true,mesh:[rockMesh],idx:ri,scale:s}); ri++; }
  for(let i=0;i<BUSH_N;i++){ const p=spot(4); const s=rand(0.8,1.2);
    dummy.position.set(p.x,0.7*s,p.z); dummy.rotation.set(0,rand(0,6.28),0); dummy.scale.set(s*1.3,s,s*1.3); dummy.updateMatrix();
    bushMesh.setMatrixAt(i,dummy.matrix);
    const node={type:"bush",x:p.x,z:p.z,r:1.3,hits:GATHER.bush.hits,alive:true,mesh:[bushMesh],idx:i,scale:s,berryIdx:[]};
    // scatter berries on bush
    for(let b=0;b<4;b++){ const a=rand(0,6.28),rr=rand(0.5,0.9)*s;
      dummy.position.set(p.x+Math.cos(a)*rr,0.7*s+rand(0.1,0.7),p.z+Math.sin(a)*rr); dummy.rotation.set(0,0,0); dummy.scale.setScalar(1); dummy.updateMatrix();
      berryMesh.setMatrixAt(berryI,dummy.matrix); node.berryIdx.push(berryI); berryI++; }
    nodes.push(node); }
  trunkMesh.instanceMatrix.needsUpdate=canopyMesh.instanceMatrix.needsUpdate=true;
  rockMesh.instanceMatrix.needsUpdate=true; bushMesh.instanceMatrix.needsUpdate=true; berryMesh.instanceMatrix.needsUpdate=true;
}
placeInstanced();

function hideInstance(mesh,idx){ dummy.position.set(0,-9999,0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); mesh.setMatrixAt(idx,dummy.matrix); mesh.instanceMatrix.needsUpdate=true; }

// ============================ HERO ==========================================
let hero=null, mixer=null, actions={}, current=null;
const heroPos = new THREE.Vector3(0,0,0);
let heroRot = 0, swinging=0;
const loader = new GLTFLoader();
let assetsReady=false;
loader.load("./assets/models/knight.glb", (g)=>{
  hero = g.scene; hero.scale.setScalar(1.7);
  hero.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.frustumCulled=false; if(o.material) o.material.side=THREE.FrontSide; } });
  scene.add(hero);
  mixer = new THREE.AnimationMixer(hero);
  const want={ idle:"Idle", walk:"Walking_A", chop:"1H_Melee_Attack_Chop", pick:"PickUp" };
  for(const k in want){ const cl=THREE.AnimationClip.findByName(g.animations,want[k]); if(cl) actions[k]=mixer.clipAction(cl); }
  play("idle");
  assetsReady=true;
  document.getElementById("loading").style.display="none";
}, undefined, (err)=>{ console.error("GLB load failed",err); document.getElementById("loading").textContent="Asset load error"; });

function play(name,once=false){
  const a=actions[name]; if(!a||current===a&&!once) return;
  if(once){ a.reset(); a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.fadeIn(0.1).play();
    if(current) current.fadeOut(0.1); return; }
  if(current) current.fadeOut(0.2);
  a.reset().fadeIn(0.2).play(); current=a;
}

// ============================ BUILDABLES ====================================
function makeFire(x,z){
  const g=new THREE.Group();
  const logs=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.6,0.5,6),plankMat); logs.position.y=0.25; logs.castShadow=true; g.add(logs);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.18,5,10),rockMat); ring.rotation.x=Math.PI/2; ring.position.y=0.1; g.add(ring);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(0.4,1.1,6),new THREE.MeshStandardMaterial({color:0xff7a1a,emissive:0xff5500,emissiveIntensity:2})); flame.position.y=0.9; g.add(flame);
  const light=new THREE.PointLight(0xff8a3a,0,16,2); light.position.set(0,1.4,0); g.add(light);
  g.position.set(x,0,z); g.userData={kind:"fire",flame,light,r:2.4}; scene.add(g); return g;
}
function makeWall(x,z,ry){
  const w=new THREE.Mesh(new THREE.BoxGeometry(4,3,0.5),plankMat); w.position.set(x,1.5,z); w.rotation.y=ry; w.castShadow=w.receiveShadow=true;
  w.userData={kind:"wall",r:2}; scene.add(w); return w;
}
function makeChest(x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.9,1),plankMat); body.position.y=0.45; body.castShadow=true; g.add(body);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.4,1.05),barkMat); lid.position.y=1.0; g.add(lid);
  g.position.set(x,0,z); g.userData={kind:"chest",r:1.4}; scene.add(g); return g;
}

// ============================ ZONAS CLÍNICAS ================================
const ZONA_ORDER = [
  'casa-sonido','escuela-silabas','taller-policubos',
  'plaza-domino','carpa-bingo','biblioteca','mundo-rimas'
];
const ZONA_REWARDS = {
  'casa-sonido':     {emoji:'🎵',name:'Nota Mágica'},
  'escuela-silabas': {emoji:'📝',name:'Pergamino'},
  'taller-policubos':{emoji:'🧩',name:'Pieza Mágica'},
  'plaza-domino':    {emoji:'⚡',name:'Rayo Fonético'},
  'carpa-bingo':     {emoji:'🎭',name:'Máscara'},
  'biblioteca':      {emoji:'📖',name:'Libro Antiguo'},
  'mundo-rimas':     {emoji:'🌟',name:'Estrella Dorada'},
};
const ZONAS_CLINICAS = [
  { id:'casa-sonido',      name:'Casa del Sonido',     emoji:'🏠', x:-55, z:-55, color:0xef5350 },
  { id:'escuela-silabas',  name:'Escuela de Sílabas',  emoji:'🏫', x:-15, z:-65, color:0xfdd835 },
  { id:'taller-policubos', name:'Taller de Policubos', emoji:'🧱', x: 35, z:-58, color:0x0288d1 },
  { id:'carpa-bingo',      name:'Carpa del Bingo',     emoji:'🎪', x:-65, z:  5, color:0x8e24aa },
  { id:'plaza-domino',     name:'Plaza Dominó',        emoji:'🎯', x: 10, z:  8, color:0x43a047 },
  { id:'biblioteca',       name:'Biblioteca Léxica',   emoji:'📚', x: 58, z:  0, color:0xef8c00 },
  { id:'mundo-rimas',      name:'Mundo de Rimas',      emoji:'🌈', x: -8, z: 58, color:0xe91e63 },
];
let visitedZones=[], inventory=[];

function isUnlocked(id){
  const idx=ZONA_ORDER.indexOf(id);
  if(idx<=0) return true;
  return visitedZones.includes(ZONA_ORDER[idx-1]);
}

const zonaObjects=[];

function buildZonas(){
  for(const z of ZONAS_CLINICAS){
    const g=new THREE.Group();
    const baseMat=new THREE.MeshStandardMaterial({color:z.color,roughness:0.8});
    const base=new THREE.Mesh(new THREE.CylinderGeometry(5,5,0.3,16),baseMat);
    base.position.y=0.15; base.receiveShadow=true; g.add(base);
    const bodyMat=new THREE.MeshStandardMaterial({color:z.color,roughness:0.7});
    const body=new THREE.Mesh(new THREE.BoxGeometry(6,5,6),bodyMat);
    body.position.y=2.8; body.castShadow=true; g.add(body);
    const roofHex=new THREE.Color(z.color).multiplyScalar(0.65).getHex();
    const roofMat=new THREE.MeshStandardMaterial({color:roofHex,roughness:0.9});
    const roof=new THREE.Mesh(new THREE.ConeGeometry(5,3,4),roofMat);
    roof.position.y=6.8; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
    const light=new THREE.PointLight(z.color,0.7,22); light.position.y=4; g.add(light);
    g.position.set(z.x,0,z.z); scene.add(g);
    zonaObjects.push({id:z.id,name:z.name,emoji:z.emoji,x:z.x,z:z.z,r:8,
      originalColor:z.color,originalRoofHex:roofHex,baseMat,bodyMat,roofMat,light});
  }
}
buildZonas();

function updateZonaStates(){
  for(const zo of zonaObjects){
    const visited=visitedZones.includes(zo.id);
    const unlocked=isUnlocked(zo.id);
    if(visited){
      zo.baseMat.color.setHex(0xffd700); zo.bodyMat.color.setHex(0xffd700);
      zo.roofMat.color.setHex(0xb8860b); zo.light.color.setHex(0xffd700); zo.light.intensity=1.4;
    } else if(unlocked){
      zo.baseMat.color.setHex(zo.originalColor); zo.bodyMat.color.setHex(zo.originalColor);
      zo.roofMat.color.setHex(zo.originalRoofHex); zo.light.color.setHex(zo.originalColor); zo.light.intensity=0.7;
    } else {
      zo.baseMat.color.setHex(0x555555); zo.bodyMat.color.setHex(0x444444);
      zo.roofMat.color.setHex(0x333333); zo.light.color.setHex(0x111111); zo.light.intensity=0.05;
    }
  }
}

// ============================ MINIMAP =======================================
const minimap=document.createElement('canvas');
minimap.width=160; minimap.height=140;
minimap.style.cssText='position:fixed;bottom:80px;right:14px;width:160px;height:140px;border-radius:10px;border:2px solid rgba(255,255,255,0.15);z-index:21;display:none;';
document.body.appendChild(minimap);
const mctx=minimap.getContext('2d');

function drawMinimap(){
  if(!S.started) return;
  const W=minimap.width,H=minimap.height;
  mctx.clearRect(0,0,W,H);
  mctx.fillStyle='rgba(8,25,12,0.92)'; mctx.fillRect(0,0,W,H);
  mctx.strokeStyle='rgba(34,197,94,0.2)'; mctx.lineWidth=1; mctx.strokeRect(3,3,W-6,H-18);
  const tx=x=>((x+WORLD)/(WORLD*2))*(W-12)+6;
  const tz=z=>((z+WORLD)/(WORLD*2))*(H-22)+6;
  for(const zo of zonaObjects){
    const mx=tx(zo.x),mz=tz(zo.z);
    const visited=visitedZones.includes(zo.id),unlocked=isUnlocked(zo.id);
    const order=ZONA_ORDER.indexOf(zo.id)+1;
    mctx.beginPath(); mctx.arc(mx,mz,7,0,Math.PI*2);
    mctx.fillStyle=visited?'#ffd700':unlocked?('#'+zo.originalColor.toString(16).padStart(6,'0')):'#444';
    mctx.fill();
    mctx.strokeStyle=visited?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)'; mctx.lineWidth=1.5; mctx.stroke();
    mctx.font='bold 9px sans-serif'; mctx.textAlign='center'; mctx.textBaseline='middle';
    mctx.fillStyle=visited?'#000':'#fff';
    mctx.fillText(visited?'★':String(order),mx,mz);
  }
  const px=tx(heroPos.x),pz=tz(heroPos.z);
  mctx.beginPath(); mctx.arc(px,pz,4,0,Math.PI*2);
  mctx.fillStyle='#fff'; mctx.fill();
  mctx.strokeStyle='#000'; mctx.lineWidth=1.5; mctx.stroke();
  mctx.font='bold 8px sans-serif'; mctx.fillStyle='rgba(187,247,208,0.5)';
  mctx.textAlign='center'; mctx.textBaseline='alphabetic';
  mctx.fillText('MAPA DEL BOSQUE',W/2,H-3);
}

// ============================ ETIQUETAS FLOTANTES ===========================
const labelContainer=document.createElement('div');
labelContainer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:15;overflow:hidden;';
document.body.appendChild(labelContainer);
const zonaLabelEls={};

function createLabels(){
  for(const zo of zonaObjects){
    const el=document.createElement('div');
    el.style.cssText='position:absolute;transform:translate(-50%,-100%);text-align:center;pointer-events:none;transition:opacity 0.4s;display:none;';
    labelContainer.appendChild(el);
    zonaLabelEls[zo.id]=el;
  }
  updateLabelContent();
}

function updateLabelContent(){
  for(const zo of zonaObjects){
    const el=zonaLabelEls[zo.id]; if(!el) continue;
    const visited=visitedZones.includes(zo.id),unlocked=isUnlocked(zo.id);
    const order=ZONA_ORDER.indexOf(zo.id)+1;
    let badge,clr,bg,sub;
    if(visited){badge='⭐';clr='#ffd700';bg='rgba(60,40,0,0.88)';sub='Completada ✓';}
    else if(unlocked){badge=zo.emoji;clr='#f0fdf4';bg='rgba(0,0,0,0.80)';sub='▼ Entra al llegar';}
    else{badge='🔒';clr='#999';bg='rgba(0,0,0,0.65)';sub='Completa zona '+(order-1)+' primero';}
    el.innerHTML='<div style="background:'+bg+';border-radius:8px;padding:3px 10px 4px;font-size:12px;font-weight:bold;color:'+clr+';border:1px solid rgba(255,255,255,0.12);white-space:nowrap;">'+badge+' '+zo.name+'<br><span style="font-size:10px;font-weight:normal;opacity:0.75;">'+sub+'</span></div><div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid '+bg+';margin:0 auto;"></div>';
  }
}

function updateLabels(){
  if(!S.started) return;
  for(const zo of zonaObjects){
    const el=zonaLabelEls[zo.id]; if(!el) continue;
    const pos=new THREE.Vector3(zo.x,10,zo.z);
    pos.project(camera);
    if(pos.z>1){el.style.display='none';continue;}
    const sx=(pos.x*0.5+0.5)*innerWidth, sy=(-pos.y*0.5+0.5)*innerHeight;
    const d=Math.sqrt(dist2(heroPos.x,heroPos.z,zo.x,zo.z));
    const opacity=d<55?Math.max(0,Math.min(1,(55-d)/28)):0;
    el.style.display=opacity>0.04?'block':'none';
    el.style.left=sx+'px'; el.style.top=sy+'px'; el.style.opacity=String(opacity);
  }
}

function updateInventory(){
  const starsEl=document.getElementById('v-stars');
  if(starsEl) starsEl.textContent=visitedZones.length+'/7';
  const inv=document.getElementById('inventory');
  if(inv) inv.innerHTML=ZONA_ORDER.filter(id=>visitedZones.includes(id)).map(id=>{
    const r=ZONA_REWARDS[id];
    return r?'<span title="'+r.name+'" style="font-size:18px;text-shadow:0 1px 4px #000;cursor:default;">'+r.emoji+'</span>':'';
  }).join('')+'&nbsp;';
}

// ============================ INPUT =========================================
const BIND={ KeyW:"up",KeyS:"down",KeyA:"left",KeyD:"right",
             ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",
             KeyE:"gather",KeyF:"eat",Digit1:"b1",Digit2:"b2",Digit3:"b3" };
const PAD={0:"gather",2:"eat",12:"up",13:"down",14:"left",15:"right"};
const held=new Set(); const pressed=new Set();
addEventListener("keydown",e=>{ const c=BIND[e.code]; if(c){ if(!held.has(c))pressed.add(c); held.add(c); e.preventDefault(); } });
addEventListener("keyup",e=>{ const c=BIND[e.code]; if(c)held.delete(c); });

// mouse look (yaw orbit) — pointer drag
let camYaw=0, camPitch=0.5, dragging=false, lastX=0,lastY=0;
canvas.addEventListener("mousedown",e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; });
addEventListener("mouseup",()=>dragging=false);
addEventListener("mousemove",e=>{ if(!dragging)return; camYaw-=(e.clientX-lastX)*0.005; camPitch=Math.max(0.15,Math.min(1.2,camPitch+(e.clientY-lastY)*0.004)); lastX=e.clientX; lastY=e.clientY; });
let camDist=10;
addEventListener("wheel",e=>{ camDist=Math.max(5,Math.min(20,camDist+e.deltaY*0.01)); },{passive:true});

// touch: left half = move joystick, right buttons handled by DOM
let joy={active:false,sx:0,sy:0,dx:0,dy:0,id:-1};
let lookT={id:-1,x:0,y:0};
canvas.addEventListener("touchstart",e=>{ for(const t of e.changedTouches){
  if(t.clientX<innerWidth*0.5 && !joy.active){ joy.active=true; joy.sx=t.clientX; joy.sy=t.clientY; joy.dx=0; joy.dy=0; joy.id=t.identifier; }
  else if(lookT.id<0){ lookT.id=t.identifier; lookT.x=t.clientX; lookT.y=t.clientY; } } e.preventDefault(); },{passive:false});
canvas.addEventListener("touchmove",e=>{ for(const t of e.changedTouches){
  if(t.identifier===joy.id){ joy.dx=(t.clientX-joy.sx)/45; joy.dy=(t.clientY-joy.sy)/45; joy.dx=Math.max(-1,Math.min(1,joy.dx)); joy.dy=Math.max(-1,Math.min(1,joy.dy)); }
  else if(t.identifier===lookT.id){ camYaw-=(t.clientX-lookT.x)*0.006; camPitch=Math.max(0.15,Math.min(1.2,camPitch+(t.clientY-lookT.y)*0.005)); lookT.x=t.clientX; lookT.y=t.clientY; } } e.preventDefault(); },{passive:false});
canvas.addEventListener("touchend",e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ joy.active=false; joy.id=-1; joy.dx=joy.dy=0; } if(t.identifier===lookT.id)lookT.id=-1; } e.preventDefault(); },{passive:false});

function padPoll(){ const out={ax:0,ay:0}; for(const gp of (navigator.getGamepads?.()||[])){ if(!gp)continue;
  if(Math.abs(gp.axes[0])>0.15)out.ax=gp.axes[0]; if(Math.abs(gp.axes[1])>0.15)out.ay=gp.axes[1];
  gp.buttons.forEach((b,i)=>{ const c=PAD[i]; if(c&&b.pressed){ if(!held.has("pad"+c))pressed.add(c); held.add("pad"+c);} else if(c){ held.delete("pad"+c);} }); } return out; }

// DOM buttons (mobile)
document.getElementById("btn-gather").addEventListener("touchstart",e=>{e.preventDefault();pressed.add("gather");},{passive:false});
document.getElementById("btn-eat").addEventListener("touchstart",e=>{e.preventDefault();pressed.add("eat");},{passive:false});
for(const [id,cmd] of [["bb1","b1"],["bb2","b2"],["bb3","b3"]]) document.getElementById(id).addEventListener("touchstart",e=>{e.preventDefault();pressed.add(cmd);},{passive:false});

// ============================ HUD / MESSAGES ================================
const hud=document.getElementById("hud");
let msg="", msgT=0;
function toast(s){ msg=s; msgT=2.6; }
function setText(id,v){ document.getElementById(id).textContent=v; }

// ============================ AUDIO =========================================
const A={};
function loadSfx(n){ const a=new Audio(`./assets/audio/${n}.mp3`); a.preload="auto"; return a; }
A.chop=loadSfx("chop"); A.mine=loadSfx("mine"); A.pickup=loadSfx("pickup");
A.amb=loadSfx("ambient"); A.amb.loop=true; A.amb.volume=0.35;
function sfx(n){ try{ const a=A[n].cloneNode(); a.volume=0.6; a.play().catch(()=>{}); }catch(e){} }

// ============================ HELPERS =======================================
function dist2(ax,az,bx,bz){ return (ax-bx)**2+(az-bz)**2; }
function nearestNode(){ let best=null,bd=9; for(const n of nodes){ if(!n.alive)continue; const d=dist2(heroPos.x,heroPos.z,n.x,n.z); if(d<bd){bd=d;best=n;} } return best; }
function canAfford(c){ return Object.entries(c).every(([k,v])=>S[k]>=v); }
function pay(c){ for(const k in c)S[k]-=c[k]; }

// ============================ SIMULATION ====================================
function update(dt){
  if(!S.started||S.paused||S.dead||!assetsReady){ if(mixer)mixer.update(dt/1000); return; }
  const sdt=dt/1000;
  // time / day cycle
  S.t+=sdt; if(S.t>=DAY_LENGTH){ S.t-=DAY_LENGTH; S.day++; S.hunger=Math.min(100,S.hunger+10); toast(STR.msg_dawn); }
  const phase=S.t/DAY_LENGTH;             // 0..1
  const daylight=Math.max(0, Math.sin(phase*Math.PI*2 - Math.PI*0.5)*0.5+0.5); // peak midday
  const isNight = daylight<0.25;

  // movement
  let mx=0,mz=0;
  const pad=padPoll();
  if(held.has("up")) mz+=1; if(held.has("down")) mz-=1; if(held.has("left")) mx+=1; if(held.has("right")) mx-=1;
  mx+=pad.ax; mz-=pad.ay; if(joy.active){ mx+=joy.dx; mz-=joy.dy; }
  const ml=Math.hypot(mx,mz);
  let moving=false;
  if(ml>0.1 && swinging<=0){
    mx/=ml; mz/=ml; moving=true;
    // movement relative to camera yaw
    const cos=Math.cos(camYaw), sin=Math.sin(camYaw);
    const wx = mx*cos - mz*sin, wz = mx*sin + mz*cos;
    const spd=7*sdt;
    let nx=heroPos.x+wx*spd, nz=heroPos.z+wz*spd;
    nx=Math.max(-WORLD+2,Math.min(WORLD-2,nx)); nz=Math.max(-WORLD+2,Math.min(WORLD-2,nz));
    // block by nodes/builds
    let blocked=false;
    for(const n of nodes){ if(n.alive&&dist2(nx,nz,n.x,n.z)<(n.r+0.8)**2){blocked=true;break;} }
    if(!blocked)for(const b of S.builds){ if(dist2(nx,nz,b.position.x,b.position.z)<(b.userData.r+0.6)**2){blocked=true;break;} }
    if(!blocked){ heroPos.x=nx; heroPos.z=nz; }
    heroRot=Math.atan2(wx,wz);
  }

  // detectar zona clínica — auto-entrada al llegar (sin pulsar nada)
  S.nearZona=null;
  for(const zona of zonaObjects){
    if(dist2(heroPos.x,heroPos.z,zona.x,zona.z)<zona.r**2){ S.nearZona=zona; break; }
  }
  if(S.nearZona && !S._zonaLock){
    S._zonaLock=true;
    if(!isUnlocked(S.nearZona.id)){
      const prevId=ZONA_ORDER[ZONA_ORDER.indexOf(S.nearZona.id)-1];
      const prevZ=ZONAS_CLINICAS.find(z=>z.id===prevId);
      toast('🔒 Primero: '+(prevZ?prevZ.emoji+' '+prevZ.name:'zona anterior'));
    } else {
      window.parent.postMessage({type:'fonomundos:zone-enter',zoneId:S.nearZona.id},'*');
      pressed.clear(); return;
    }
  }
  if(!S.nearZona) S._zonaLock=false;

  // gather
  S.nearTarget=nearestNode();
  if(pressed.has("gather")&&S.nearTarget&&swinging<=0){
    const n=S.nearTarget; const g=GATHER[n.type];
    swinging=0.6; heroRot=Math.atan2(n.x-heroPos.x,n.z-heroPos.z);
    play("chop",true);
    sfx(n.type==="rock"?"mine":n.type==="bush"?"pickup":"chop");
    n.hits--;
    S[g.res]+=g.amt;
    if(n.type==="bush"){ // pop berries off
      for(const bi of n.berryIdx) hideInstance(berryMesh,bi);
    }
    if(n.hits<=0){ n.alive=false; for(const m of n.mesh) hideInstance(m,n.idx); toast(`+${g.amt} ${g.res}`); }
    else toast(`+${g.amt} ${g.res}`);
  }

  // eat
  if(pressed.has("eat")){ if(S.berries>0){ S.berries--; S.hunger=Math.min(100,S.hunger+18); sfx("pickup"); toast(STR.msg_ate);} else toast(STR.msg_no_berries); }

  // build
  function build(kind,maker){ if(!canAfford(COSTS[kind])){ toast(kind==="wall"&&S.wood<COSTS.wall.wood?STR.msg_need_wood:kind!=="wall"&&S.wood<(COSTS[kind].wood||0)?STR.msg_need_wood:STR.msg_need_stone); return; }
    pay(COSTS[kind]); const fx=heroPos.x+Math.sin(heroRot)*3, fz=heroPos.z+Math.cos(heroRot)*3;
    const obj = kind==="wall"?maker(fx,fz,heroRot):maker(fx,fz); S.builds.push(obj);
    toast(kind==="fire"?STR.msg_built_fire:kind==="wall"?STR.msg_built_wall:STR.msg_built_chest); play("pick",true); swinging=0.5; }
  if(pressed.has("b1")) build("fire",makeFire);
  if(pressed.has("b2")) build("wall",makeWall);
  if(pressed.has("b3")) build("chest",makeChest);

  // fire warmth + flame flicker + fuel
  S.nearFire=false;
  for(const b of S.builds){ if(b.userData.kind==="fire"){
    b.userData.fuel = (b.userData.fuel===undefined? 30 : b.userData.fuel - sdt);
    const lit = b.userData.fuel>0;
    b.userData.flame.visible=lit;
    b.userData.light.intensity = lit ? (2.2+Math.sin(performance.now()*0.01)*0.5) : 0;
    if(lit){ b.userData.flame.scale.y=1+Math.sin(performance.now()*0.02)*0.15; if(dist2(heroPos.x,heroPos.z,b.position.x,b.position.z)<b.userData.r**2) S.nearFire=true; }
  }}

  // survival clock
  S.hunger=Math.max(0,S.hunger - HUNGER_DRAIN*sdt);
  if(isNight && !S.nearFire) S.warmth=Math.max(0,S.warmth - WARMTH_DRAIN_NIGHT*sdt);
  else S.warmth=Math.min(100,S.warmth + WARMTH_REGAIN*sdt);
  // penalties: low warmth speeds hunger; zero hunger or zero warmth -> health damage (use hunger as life proxy)
  if(S.warmth<=0) S.hunger=Math.max(0,S.hunger - 6*sdt);
  if(S.hunger<=0){ S.dead=true; toast(STR.msg_dead); setTimeout(respawn,2500); }
  else if(S.hunger<22) toast(STR.msg_starving);
  else if(isNight && S.warmth<22 && !S.nearFire) toast(STR.msg_freezing);

  // lighting by daylight
  sun.intensity = daylight*2.0;
  sun.color.setHSL(0.09, 0.6, 0.45+daylight*0.25);
  const ang=phase*Math.PI*2;
  sun.position.set(Math.cos(ang)*60+heroPos.x, Math.max(5,Math.sin(ang)*70+20), Math.sin(ang)*40+heroPos.z);
  sun.target.position.copy(heroPos);
  moon.intensity = isNight?0.35:0.0;
  moon.position.set(-40+heroPos.x,40,-30+heroPos.z);
  hemi.intensity=0.25+daylight*0.6;
  const sky=new THREE.Color().setHSL(0.6,0.4, 0.12+daylight*0.45);
  scene.background.copy(sky); scene.fog.color.copy(sky);

  // hero transform + anim state
  if(hero){ hero.position.set(heroPos.x,0,heroPos.z); hero.rotation.y=heroRot; }
  if(swinging>0){ swinging-=sdt; }
  else if(moving) play("walk"); else play("idle");
  if(mixer) mixer.update(sdt);

  pressed.clear();
  // refresh HUD
  setText("v-wood",S.wood); setText("v-stone",S.stone); setText("v-berries",S.berries);
  document.getElementById("bar-hunger").style.width=S.hunger+"%";
  document.getElementById("bar-warmth").style.width=S.warmth+"%";
  const hh=Math.floor(phase*24); setText("v-time",(isNight?"🌙 ":"☀ ")+String(hh).padStart(2,"0")+":00");
  setText("v-day",S.day);
  const pr=document.getElementById("prompt");
  if(S.nearZona){
    pr.style.display="block";
    if(isUnlocked(S.nearZona.id)) pr.textContent=S.nearZona.emoji+' '+S.nearZona.name+' — Entrando...';
    else pr.textContent='🔒 '+S.nearZona.name+' — Completa la zona anterior';
  } else if(S.nearTarget){ pr.style.display="block"; pr.textContent=S.nearTarget.type==="tree"?STR.prompt_chop:S.nearTarget.type==="rock"?STR.prompt_mine:STR.prompt_forage; }
  else pr.style.display="none";
  if(document.getElementById("v-stars")) document.getElementById("v-stars").textContent=visitedZones.length+"/7";
  if(msgT>0){ msgT-=sdt; document.getElementById("toast").textContent=msg; document.getElementById("toast").style.opacity=Math.min(1,msgT); }
}

function respawn(){ S.dead=false; S.hunger=70; S.warmth=70; heroPos.set(0,0,0); }

// ============================ CAMERA + RENDER ===============================
function render(){
  if(hero){
    const tx=heroPos.x - Math.sin(camYaw)*Math.cos(camPitch)*camDist;
    const ty=2 + Math.sin(camPitch)*camDist;
    const tz=heroPos.z - Math.cos(camYaw)*Math.cos(camPitch)*camDist;
    camera.position.lerp(new THREE.Vector3(tx,ty,tz),0.18);
    camera.lookAt(heroPos.x,2.2,heroPos.z);
  }
  renderer.render(scene,camera);
  drawMinimap();
  updateLabels();
}

// ============================ LOOP ==========================================
function resize(){ renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio||1,DPR_CAP)); }
addEventListener("resize",resize); addEventListener("orientationchange",resize); resize();
addEventListener("blur",()=>{ if(S.started)S.paused=true; });
addEventListener("focus",()=>{ S.paused=false; last=performance.now(); });

const dev=new URLSearchParams(location.search).has("dev");
if(dev) document.getElementById("dev").style.display="block";
let acc=0,last=performance.now(),frames=0,fpsAt=last;
function frame(now){
  requestAnimationFrame(frame);
  acc+=now-last; last=now;
  if(acc>250)acc=250;
  while(acc>=STEP){ update(STEP); acc-=STEP; }
  render();
  if(dev){ frames++; if(now-fpsAt>=500){ const fps=Math.round(frames*1000/(now-fpsAt)); frames=0; fpsAt=now;
    document.getElementById("dev").textContent=`${fps} fps · draws ${renderer.info.render.calls} · tris ${renderer.info.render.triangles}`; } }
}
requestAnimationFrame(frame);

// ============================ START GATE ====================================
document.getElementById("start").addEventListener("click",()=>{
  S.started=true; document.getElementById("startscreen").style.display="none";
  hud.style.display="block";
  minimap.style.display='block';
  createLabels();
  updateZonaStates();
  updateInventory();
  A.amb.play().catch(()=>{});
});
window.__GAME=S; // for smoke probe

// Escuchar mensajes desde React (init + zone-exit)
window.addEventListener('message',(e)=>{
  if(e.data?.type==='fonomundos:zone-exit'){
    S.paused=false;
    if(Array.isArray(e.data.visitedZones)){
      const prev=visitedZones.length;
      visitedZones=e.data.visitedZones;
      if(visitedZones.length>prev && e.data.zoneId){
        const r=ZONA_REWARDS[e.data.zoneId];
        if(r) toast('¡'+r.emoji+' '+r.name+' conseguida!');
      }
      updateZonaStates(); updateLabelContent(); updateInventory();
    }
  }
  if(e.data?.type==='fonomundos:init'){
    if(Array.isArray(e.data.visitedZones)){
      visitedZones=e.data.visitedZones;
      updateZonaStates(); updateLabelContent(); updateInventory();
    }
  }
});
