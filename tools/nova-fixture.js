/* NOVA hooks test fixture (tools/nova-test.js): writes a tiny PROCEDURAL stand-in into an untracked `private-assets/` folder.
   Code only, for tests; it is not art, not a substitute model, and nothing here is shipped or served by the game.
   Contents: a 14-joint Mixamo-named skeleton with boxes skinned 1:1 (hero.tank, model forward +X), clips idle/run/attack/hit/die (clip-only GLBs, same node names),
   a weapon with two named anchor nodes, a 128x128 PNG glyph and a one-box terrace tile.
   node tools/nova-fixture.js <outDir> */
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const out=path.resolve(process.argv[2]||'private-assets');fs.mkdirSync(out,{recursive:true});
// ---- minimal GLB writer ----
function glb(json,bin){const j=Buffer.from(JSON.stringify(json));const jp=(4-j.length%4)%4,bp=(4-bin.length%4)%4;const J=Buffer.concat([j,Buffer.alloc(jp,32)]),B=Buffer.concat([bin,Buffer.alloc(bp)]);
  const h=Buffer.alloc(12);h.write('glTF',0);h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+J.length+8+B.length,8);
  const c1=Buffer.alloc(8);c1.writeUInt32LE(J.length,0);c1.write('JSON',4);const c2=Buffer.alloc(8);c2.writeUInt32LE(B.length,0);c2.write('BIN\0',4);return Buffer.concat([h,c1,J,c2,B])}
class Pack{constructor(){this.chunks=[];this.views=[];this.acc=[];this.off=0}
  add(buf,type,count,compType,target,min,max){while(this.off%4){this.chunks.push(Buffer.alloc(1));this.off++}const v={buffer:0,byteOffset:this.off,byteLength:buf.length};if(target)v.target=target;this.views.push(v);this.chunks.push(buf);this.off+=buf.length;
    const a={bufferView:this.views.length-1,componentType:compType,count,type};if(min){a.min=min;a.max=max}this.acc.push(a);return this.acc.length-1}
  f32(arr,type,count,min,max,target){return this.add(Buffer.from(new Float32Array(arr).buffer),type,count,5126,target,min,max)}
  bin(){return Buffer.concat(this.chunks)}}
// ---- skeleton ----
const BONES=[['mixamorig:Hips',-1,[0,1,0]],['mixamorig:Spine',0,[0,0.15,0]],['mixamorig:Spine1',1,[0,0.15,0]],['mixamorig:Spine2',2,[0,0.15,0]],['mixamorig:Neck',3,[0,0.15,0]],['mixamorig:Head',4,[0,0.12,0]],
  ['mixamorig:RightShoulder',3,[0,0.05,-0.08]],['mixamorig:RightArm',6,[0,0,-0.12]],['mixamorig:RightForeArm',7,[0,0,-0.25]],['mixamorig:RightHand',8,[0,0,-0.25]],
  ['mixamorig:LeftUpLeg',0,[0,-0.05,0.08]],['mixamorig:LeftLeg',10,[0,-0.45,0]],['mixamorig:RightUpLeg',0,[0,-0.05,-0.08]],['mixamorig:RightLeg',12,[0,-0.45,0]]];
const world=[];BONES.forEach((b,i)=>{const p=b[1]<0?[0,0,0]:world[b[1]];world.push([p[0]+b[2][0],p[1]+b[2][1],p[2]+b[2][2]])});
const children=i=>BONES.map((b,j)=>b[1]===i?j:-1).filter(j=>j>=0);
const boneNodes=()=>BONES.map((b,i)=>({name:b[0],translation:b[2],children:children(i).length?children(i):undefined}));
// ---- hero mesh: a box per bone, weight 1 ----
function hero(){const P=new Pack(),pos=[],uv=[],jt=[],wt=[],idx=[];const half=i=>i===0?0.12:i<6?0.09:i<10?0.04:0.06;
  BONES.forEach((b,i)=>{const c=world[i],h=half(i),base=pos.length/3;
    for(const [sx,sy,sz] of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]){pos.push(c[0]+sx*h,c[1]+sy*h,c[2]+sz*h);uv.push(sx>0?1:0,sy>0?1:0);jt.push(i,0,0,0);wt.push(1,0,0,0)}
    for(const f of [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[3,2,6],[3,6,7],[1,5,6],[1,6,2],[0,3,7],[0,7,4]])idx.push(...f.map(x=>x+base))});
  const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<pos.length;i+=3)for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],pos[i+a]);mx[a]=Math.max(mx[a],pos[i+a])}
  const aP=P.f32(pos,'VEC3',pos.length/3,mn,mx,34962),aU=P.f32(uv,'VEC2',uv.length/2,null,null,34962),aJ=P.add(Buffer.from(new Uint8Array(jt)),'VEC4',jt.length/4,5121,34962),aW=P.f32(wt,'VEC4',wt.length/4,null,null,34962),aI=P.add(Buffer.from(new Uint16Array(idx).buffer),'SCALAR',idx.length,5123,34963);
  const ibm=[];for(let i=0;i<BONES.length;i++)ibm.push(1,0,0,0,0,1,0,0,0,0,1,0,-world[i][0],-world[i][1],-world[i][2],1);const aB=P.f32(ibm,'MAT4',BONES.length);
  const nodes=boneNodes();nodes.push({name:'FixtureBody',mesh:0,skin:0});
  const json={asset:{version:'2.0',generator:'nova-fixture (procedural, tests only)'},scene:0,scenes:[{nodes:[0,BONES.length]}],nodes,skins:[{joints:BONES.map((_,i)=>i),inverseBindMatrices:aB}],
    meshes:[{primitives:[{attributes:{POSITION:aP,TEXCOORD_0:aU,JOINTS_0:aJ,WEIGHTS_0:aW},indices:aI,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[0.55,0.7,0.6,1],metallicFactor:0,roughnessFactor:0.8}}],
    accessors:P.acc,bufferViews:P.views,buffers:[{byteLength:P.bin().length}]};
  return glb(json,P.bin())}
// ---- clip GLB: skeleton nodes + one animation ----
const qz=(a)=>[0,0,Math.sin(a/2),Math.cos(a/2)],qx=a=>[Math.sin(a/2),0,0,Math.cos(a/2)],qy=a=>[0,Math.sin(a/2),0,Math.cos(a/2)];
function clip(name,dur,keys,fn,hipsT){const P=new Pack(),times=[];for(let i=0;i<=keys;i++)times.push(dur*i/keys);
  const aT=P.f32(times,'SCALAR',times.length,[0],[dur]);const samplers=[],channels=[];
  BONES.forEach((b,bi)=>{const q=[];for(const t of times)q.push(...fn(bi,t/dur,t));const a=P.f32(q,'VEC4',times.length);samplers.push({input:aT,output:a,interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:bi,path:'rotation'}})});
  if(hipsT){const v=[];for(const t of times)v.push(...hipsT(t/dur,t));const a=P.f32(v,'VEC3',times.length);samplers.push({input:aT,output:a,interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:0,path:'translation'}})}
  const json={asset:{version:'2.0',generator:'nova-fixture clip'},scene:0,scenes:[{nodes:[0]}],nodes:boneNodes(),animations:[{name,samplers,channels}],accessors:P.acc,bufferViews:P.views,buffers:[{byteLength:P.bin().length}]};return glb(json,P.bin())}
const id=[0,0,0,1],S=Math.sin,PI=Math.PI;
const clips={
  idle:clip('idle',1.0,8,(b,u)=>b===1?qz(0.05*S(2*PI*u)):id,null),
  // run: legs swing, arms counter-swing; the last key differs from the first at the right arm (a seam to blend); raw root motion along +X (3.1 units per loop)
  run:clip('run',1.25,10,(b,u)=>b===10||b===12?qz((b===10?1:-1)*0.7*S(2*PI*u)):b===7?qz(0.5*S(2*PI*u)+0.3*u):b===1?qy(0.1*S(2*PI*u)):id,(u)=>[3.1*u,1+0.03*S(4*PI*u),0]),
  // attack: arm raises (0-1.6 s), strikes down (1.6-2.0 s), rests (to 3.0 s)
  attack:clip('attack',3.0,30,(b,u,t)=>{const k=t<1.6?t/1.6:t<2.0?1-(t-1.6)/0.4*1.6:-0.6+(t-2)/1.0*0.6;return b===7?qz(-2.2*k):b===1?qz(-0.3*k):id},null),
  hit:clip('hit',0.5,5,(b,u)=>b===1?qz(0.4*S(PI*u)):id,null),
  die:clip('die',1.0,10,(b,u)=>b===0?qz(-1.4*u):id,null)};
// ---- weapon: two boxes + anchor nodes ----
function weapon(){const P=new Pack(),pos=[],uv=[],idx=[];const box=(cx,cy,cz,hx,hy,hz)=>{const base=pos.length/3;for(const [sx,sy,sz] of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]){pos.push(cx+sx*hx,cy+sy*hy,cz+sz*hz);uv.push(sx>0?1:0,sy>0?1:0)}
    for(const f of [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[3,2,6],[3,6,7],[1,5,6],[1,6,2],[0,3,7],[0,7,4]])idx.push(...f.map(x=>x+base))};
  box(0,0.2,0,0.02,0.35,0.02);box(0,0.575,0,0.2,0.09,0.07);
  const mn=[-0.2,-0.15,-0.07],mx=[0.2,0.665,0.07];const aP=P.f32(pos,'VEC3',pos.length/3,mn,mx,34962),aU=P.f32(uv,'VEC2',uv.length/2,null,null,34962),aI=P.add(Buffer.from(new Uint16Array(idx).buffer),'SCALAR',idx.length,5123,34963);
  const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0,1,2]}],nodes:[{name:'fixture_maul',mesh:0},{name:'FIX_CONTACT_BASE',translation:[0,0.575,0]},{name:'FIX_CONTACT_TIP',translation:[0.2,0.575,0]}],
    meshes:[{primitives:[{attributes:{POSITION:aP,TEXCOORD_0:aU},indices:aI,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[0.8,0.6,0.3,1],metallicFactor:0,roughnessFactor:0.7}}],accessors:P.acc,bufferViews:P.views,buffers:[{byteLength:P.bin().length}]};return glb(json,P.bin())}
function tile(){const P=new Pack(),pos=[],uv=[],idx=[];for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){pos.push(sx*0.5,0,sz*0.5);uv.push(sx>0?1:0,sz>0?1:0)}idx.push(0,2,1,0,3,2);
  const aP=P.f32(pos,'VEC3',4,[-0.5,0,-0.5],[0.5,0,0.5],34962),aU=P.f32(uv,'VEC2',4,null,null,34962),aI=P.add(Buffer.from(new Uint16Array(idx).buffer),'SCALAR',6,5123,34963);
  return glb({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'fixture_tile',mesh:0}],meshes:[{primitives:[{attributes:{POSITION:aP,TEXCOORD_0:aU},indices:aI,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[0.3,0.35,0.5,1]}}],accessors:P.acc,bufferViews:P.views,buffers:[{byteLength:P.bin().length}]},P.bin())}
// ---- 128x128 PNG (solid + border) ----
function png(){const W=128,H=128,raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;for(let x=0;x<W;x++){const o=y*(W*4+1)+1+x*4,e=x<6||y<6||x>=W-6||y>=H-6;raw[o]=e?255:40;raw[o+1]=e?220:90;raw[o+2]=e?120:160;raw[o+3]=255}}
  const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})(),crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
  const ch=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32LE(0);l.writeUInt32BE(d.length,0);const tb=Buffer.from(t),c=Buffer.alloc(4);c.writeUInt32BE(crc(Buffer.concat([tb,d])),0);return Buffer.concat([l,tb,d,c])};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ihdr),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))])}
// ---- registration files ----
const reg=(file,role,buf,kind,meta)=>fs.writeFileSync(path.join(out,file),'MBNOVA.put('+JSON.stringify(role)+',{kind:'+JSON.stringify(kind)+',b64:'+JSON.stringify(buf.toString('base64'))+'},'+JSON.stringify(meta)+');\n');
const heroMeta={heightGame:100,forward:'+X',weapon:'weapon.fixture',slots:{weapon:{bone:'mixamorig:RightHand'}},
  clips:{idle:{role:'clip.tank.idle',fade:0.2,root:'lockXZ'},run:{role:'clip.tank.run',fade:0.2,root:'lockXZ',seamBlend:0.1,timeScale:0.8},attack:{role:'clip.tank.attack',fade:0.06,root:'lockXZ'},hit:{role:'clip.tank.hit',root:'lockXZ'},die:{role:'clip.tank.die',root:'lockXZ'}},
  attack:{from:1.6,to:2.0,dur:0.18,settle:0.06,recover:{min:0.22,max:1}}};
reg('hero-tank.js','hero.tank',hero(),'glb',heroMeta);
for(const k in clips)reg('clip-'+k+'.js','clip.tank.'+k,clips[k],'glb',{});
reg('weapon-fixture.js','weapon.fixture',weapon(),'glb',{scale:1,anchors:{grip:{pos:[0,0,0],quat:[0,0,0,1]},contactBase:'FIX_CONTACT_BASE',contactTip:'FIX_CONTACT_TIP'}});
reg('glyph-test.js','glyph.test',png(),'png',{size:128});
reg('terrace-tile.js','terrace.tile',tile(),'glb',{});
fs.writeFileSync(path.join(out,'manifest.js'),'MBNOVA.manifest('+JSON.stringify(['hero-tank.js','clip-idle.js','clip-run.js','clip-attack.js','clip-hit.js','clip-die.js','weapon-fixture.js','glyph-test.js','terrace-tile.js'])+');\n');
console.log('fixture written to',out,fs.readdirSync(out).join(' '));
